using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Everything_Lost_Backend;

internal sealed class TelegramBotService(IConfiguration configuration, ILogger<TelegramBotService> logger,
    FirestoreService? firestore = null)
    : BackgroundService
{
    private const string FirestoreTestCallback = "firestore_test";
    private const string SaveUserCallback = "save_user";
    private const string WelcomePhotoFile = "Welcome_1080.png";

    private const string WelcomeCaption =
        "❄️ Ласкаво просимо до «Перед зимою»!\n" +
        "Поки за вікном падає перший сніг, на тебе чекає маленька ялинка. " +
        "Грай у «три в ряд», знаходь прикраси й наповнюй її власними історіями. " +
        "Кожна знахідка зробить очікування зими трохи теплішим. ✨\n" +
        "Твоя ялинка вже чекає. Почнімо?";

    private const string TreeReadyText = "💧 Ялинка чекає на полив! Заходь і поливай, щоб вона росла.";
    private const string BoxReadyText = "🎁 Твій подарунок знову доступний! Заходь забрати.";
    private const string PostButtonText = "📣 Створити пост";
    private const string BroadcastConfirmCallback = "broadcast_confirm";
    private const string BroadcastCancelCallback = "broadcast_cancel";
    private const long DefaultAdminId = 731475622;
    private const int LeaderboardSize = 10;

    private long AdminId => configuration.GetValue("Telegram:AdminId", DefaultAdminId);

    private string? _welcomePhotoFileId;
    private bool _awaitingPost;
    private long? _draftMessageId;
    private bool _broadcastRunning;

    private readonly HttpClient _httpClient = new()
    {
        BaseAddress = new Uri($"https://api.telegram.org/bot{configuration["Telegram:BotToken"]}/"),
        Timeout = TimeSpan.FromSeconds(40)
    };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        long offset = 0;

        await SetMenuButtonAsync(stoppingToken);

        if (firestore is not null)
        {
            _ = RunNotificationsAsync(stoppingToken);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var response = await _httpClient.GetAsync(
                    $"getUpdates?offset={offset}&timeout=30&allowed_updates=%5B%22message%22%2C%22callback_query%22%5D",
                    stoppingToken);
                response.EnsureSuccessStatusCode();

                var updates = await response.Content.ReadFromJsonAsync<TelegramResponse<TelegramUpdate[]>>(
                    cancellationToken: stoppingToken);
                if (updates is not { Ok: true, Result: not null })
                {
                    throw new JsonException("Invalid Telegram response.");
                }

                foreach (var update in updates.Result)
                {
                    if (update.Message is { Text: "/start", Chat: var chat })
                    {
                        await SendWelcomeAsync(chat.Id, stoppingToken);
                        if (chat.Id == AdminId)
                        {
                            await SendAdminKeyboardAsync(chat.Id, stoppingToken);
                        }
                    }
                    else if (update.Message is { Text: { } text, Chat: var leaderboardChat }
                             && (text == "/leaderboard" || text.StartsWith("/leaderboard@", StringComparison.Ordinal)))
                    {
                        await SendLeaderboardAsync(leaderboardChat.Id, stoppingToken);
                    }
                    else if (update.CallbackQuery is { Data: FirestoreTestCallback } query)
                    {
                        await HandleFirestoreTestAsync(query, stoppingToken);
                    }
                    else if (update.CallbackQuery is { Data: SaveUserCallback } saveQuery)
                    {
                        await HandleSaveUserAsync(saveQuery, stoppingToken);
                    }
                    else if (update.CallbackQuery is { Data: BroadcastConfirmCallback or BroadcastCancelCallback } broadcastQuery)
                    {
                        await HandleBroadcastCallbackAsync(broadcastQuery, stoppingToken);
                    }
                    else if (update.Message is { From: { } sender } adminMessage
                             && sender.Id == AdminId && adminMessage.Chat.Id == sender.Id)
                    {
                        await HandleAdminMessageAsync(adminMessage, stoppingToken);
                    }

                    offset = update.UpdateId + 1;
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning("Telegram polling failed: {Error}", ex.Message);
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task SendLeaderboardAsync(long chatId, CancellationToken cancellationToken)
    {
        string text;
        try
        {
            if (firestore is null)
            {
                text = "Firebase is not configured.";
            }
            else
            {
                var excluded = configuration.GetSection("Leaderboard:ExcludedUserIds").Get<string[]>() ?? [];
                var top = await firestore.GetLeaderboardAsync(LeaderboardSize, excluded, cancellationToken);
                string[] medals = { "🥇", "🥈", "🥉" };
                text = top.Count == 0
                    ? "🏆 Рейтинг поки порожній."
                    : "🏆 Топ гравців за зібраними монетами:\n\n" + string.Join("\n", top.Select((entry, i) =>
                    {
                        var place = i < medals.Length ? medals[i] : $"{i + 1}.";
                        var name = string.IsNullOrWhiteSpace(entry.Username) ? "Гравець" : "@" + entry.Username.TrimStart('@');
                        return $"{place} {name} — {entry.GlobalCoins} 🪙";
                    }));
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Leaderboard failed");
            text = "Не вдалося завантажити рейтинг. Спробуй пізніше.";
        }

        using var send = await _httpClient.PostAsJsonAsync("sendMessage", new { chat_id = chatId, text }, cancellationToken);
        send.EnsureSuccessStatusCode();
    }

    private async Task HandleFirestoreTestAsync(TelegramCallbackQuery query, CancellationToken cancellationToken)
    {
        string text;
        try
        {
            text = firestore is null
                ? "Firebase is not configured."
                : $"Test document written to Firestore: test/{await firestore.WriteTestDocumentAsync(query.Message!.Chat.Id, cancellationToken)}";
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Firestore test write failed");
            text = $"Firestore write failed: {ex.Message}";
        }

        using var answer = await _httpClient.PostAsJsonAsync(
            "answerCallbackQuery", new { callback_query_id = query.Id }, cancellationToken);
        using var send = await _httpClient.PostAsJsonAsync(
            "sendMessage", new { chat_id = query.Message!.Chat.Id, text }, cancellationToken);
        send.EnsureSuccessStatusCode();
    }

    private async Task SendWelcomeAsync(long chatId, CancellationToken cancellationToken)
    {
        var photoPath = Path.Combine(AppContext.BaseDirectory, "Sources", WelcomePhotoFile);

        if (_welcomePhotoFileId is null && !File.Exists(photoPath))
        {
            logger.LogWarning("Welcome image not found at {Path}, sending the text only.", photoPath);
            using var textResponse = await _httpClient.PostAsJsonAsync(
                "sendMessage",
                new { chat_id = chatId, text = WelcomeCaption },
                cancellationToken);
            textResponse.EnsureSuccessStatusCode();
            return;
        }

        using var form = new MultipartFormDataContent
        {
            { new StringContent(chatId.ToString()), "chat_id" },
            { new StringContent(WelcomeCaption), "caption" }
        };

        // After the first upload Telegram hands back a file_id, which is cheaper to resend than the 3 MB file.
        await using var photoStream = _welcomePhotoFileId is null ? File.OpenRead(photoPath) : null;
        if (photoStream is null)
        {
            form.Add(new StringContent(_welcomePhotoFileId!), "photo");
        }
        else
        {
            form.Add(new StreamContent(photoStream), "photo", WelcomePhotoFile);
        }

        using var response = await _httpClient.PostAsync("sendPhoto", form, cancellationToken);
        response.EnsureSuccessStatusCode();

        if (_welcomePhotoFileId is null)
        {
            using var body = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
            var sizes = body.RootElement.GetProperty("result").GetProperty("photo");
            _welcomePhotoFileId = sizes[sizes.GetArrayLength() - 1].GetProperty("file_id").GetString();
        }
    }

    /// <summary>
    /// Points the bot's menu button (next to the message field) at the Mini App. Telegram only accepts https URLs.
    /// Runs on every start, so a new tunnel URL needs nothing but a restart.
    /// </summary>
    private async Task SetMenuButtonAsync(CancellationToken cancellationToken)
    {
        var miniAppUrl = configuration["Telegram:MiniAppUrl"];
        if (string.IsNullOrWhiteSpace(miniAppUrl))
        {
            return;
        }

        try
        {
            using var response = await _httpClient.PostAsJsonAsync(
                "setChatMenuButton",
                new { menu_button = new { type = "web_app", text = "Play", web_app = new { url = miniAppUrl } } },
                cancellationToken);
            response.EnsureSuccessStatusCode();
        }
        // An HttpClient timeout is a TaskCanceledException too, so only a real shutdown may pass through.
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Setting the Telegram menu button failed: {Error}", ex.Message);
        }
    }

    private async Task HandleSaveUserAsync(TelegramCallbackQuery query, CancellationToken cancellationToken)
    {
        string text;
        try
        {
            if (firestore is null)
            {
                text = "Firebase is not configured.";
            }
            else
            {
                await firestore.SaveUserAsync(query.From.Id, query.From.Username, cancellationToken);
                text = $"User saved to Firestore: Users/{query.From.Id} (username: {query.From.Username ?? "none"})";
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Firestore user save failed");
            text = $"Firestore write failed: {ex.Message}";
        }

        using var answer = await _httpClient.PostAsJsonAsync(
            "answerCallbackQuery", new { callback_query_id = query.Id }, cancellationToken);
        using var send = await _httpClient.PostAsJsonAsync(
            "sendMessage", new { chat_id = query.Message!.Chat.Id, text }, cancellationToken);
        send.EnsureSuccessStatusCode();
    }

    /// <summary>
    /// Admin flow: /post, then any message (text, photo, ...) becomes the draft, a preview with confirm/cancel
    /// buttons follows, and only the confirmation broadcasts it to every known player.
    /// </summary>
    private async Task HandleAdminMessageAsync(TelegramMessage message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        try
        {
            if (message.Text == "/cancel")
            {
                _awaitingPost = false;
                _draftMessageId = null;
                await SendTextAsync(chatId, "Скасовано.", cancellationToken);
            }
            else if (message.Text is "/post" or PostButtonText)
            {
                if (_broadcastRunning)
                {
                    await SendTextAsync(chatId, "Розсилка ще триває, зачекай завершення.", cancellationToken);
                    return;
                }

                _awaitingPost = true;
                _draftMessageId = null;
                await SendTextAsync(chatId,
                    "Надішли пост одним повідомленням (текст, фото з підписом тощо). /cancel — скасувати.",
                    cancellationToken);
            }
            else if (_awaitingPost)
            {
                _awaitingPost = false;
                _draftMessageId = message.MessageId;

                using var preview = await _httpClient.PostAsJsonAsync(
                    "copyMessage",
                    new { chat_id = chatId, from_chat_id = chatId, message_id = message.MessageId },
                    cancellationToken);
                preview.EnsureSuccessStatusCode();

                using var prompt = await _httpClient.PostAsJsonAsync(
                    "sendMessage",
                    new
                    {
                        chat_id = chatId,
                        text = "Так виглядатиме пост. Надіслати всім гравцям?",
                        reply_markup = new
                        {
                            inline_keyboard = new[]
                            {
                                new[]
                                {
                                    new { text = "✅ Надіслати всім", callback_data = BroadcastConfirmCallback },
                                    new { text = "❌ Скасувати", callback_data = BroadcastCancelCallback }
                                }
                            }
                        }
                    },
                    cancellationToken);
                prompt.EnsureSuccessStatusCode();
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Admin message handling failed");
        }
    }

    private async Task HandleBroadcastCallbackAsync(TelegramCallbackQuery query, CancellationToken cancellationToken)
    {
        try
        {
            using var answer = await _httpClient.PostAsJsonAsync(
                "answerCallbackQuery", new { callback_query_id = query.Id }, cancellationToken);

            if (query.From.Id != AdminId || query.Message is null)
            {
                return;
            }

            var chatId = query.Message.Chat.Id;
            var draft = _draftMessageId;
            _draftMessageId = null;

            if (query.Data == BroadcastCancelCallback || draft is null)
            {
                await SendTextAsync(chatId, draft is null ? "Немає чернетки. Почни з /post." : "Скасовано.",
                    cancellationToken);
                return;
            }

            if (firestore is null)
            {
                await SendTextAsync(chatId, "Firebase is not configured.", cancellationToken);
                return;
            }

            if (_broadcastRunning)
            {
                await SendTextAsync(chatId, "Розсилка ще триває.", cancellationToken);
                return;
            }

            _broadcastRunning = true;
            await SendTextAsync(chatId, "Розсилку розпочато…", cancellationToken);
            // Runs detached so long broadcasts do not stall update polling.
            _ = Task.Run(() => BroadcastAsync(chatId, draft.Value, cancellationToken), CancellationToken.None);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Broadcast callback handling failed");
        }
    }

    private async Task BroadcastAsync(long adminChatId, long draftMessageId, CancellationToken cancellationToken)
    {
        int sent = 0, failed = 0, total = 0;
        try
        {
            var userIds = await firestore!.GetTelegramUserIdsAsync(cancellationToken);
            total = userIds.Count;

            foreach (var userId in userIds)
            {
                if (await TryCopyMessageAsync(userId, adminChatId, draftMessageId, cancellationToken))
                    sent++;
                else
                    failed++;

                // Telegram allows roughly 30 messages per second to different chats.
                await Task.Delay(TimeSpan.FromMilliseconds(50), cancellationToken);
            }

            await SendTextAsync(adminChatId,
                $"Розсилку завершено. Усього: {total}, доставлено: {sent}, не доставлено: {failed}.", CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Broadcast failed");
            try
            {
                await SendTextAsync(adminChatId,
                    $"Розсилка перервана: {ex.Message}. Доставлено: {sent} з {total}.", CancellationToken.None);
            }
            catch (Exception notifyEx)
            {
                logger.LogWarning("Could not notify the admin: {Error}", notifyEx.Message);
            }
        }
        finally
        {
            _broadcastRunning = false;
        }
    }

    private async Task<bool> TryCopyMessageAsync(long chatId, long fromChatId, long messageId,
        CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            using var response = await _httpClient.PostAsJsonAsync(
                "copyMessage", new { chat_id = chatId, from_chat_id = fromChatId, message_id = messageId },
                cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                return true;
            }

            if (response.StatusCode != System.Net.HttpStatusCode.TooManyRequests)
            {
                // 403 = the player blocked the bot or never started it; nothing to retry.
                logger.LogInformation("Broadcast to {ChatId} failed: {Status}", chatId, (int)response.StatusCode);
                return false;
            }

            var retryAfter = 5;
            try
            {
                using var body = await JsonDocument.ParseAsync(
                    await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
                retryAfter = body.RootElement.GetProperty("parameters").GetProperty("retry_after").GetInt32();
            }
            catch (Exception ex) when (ex is JsonException or KeyNotFoundException or InvalidOperationException)
            {
            }

            await Task.Delay(TimeSpan.FromSeconds(retryAfter + 1), cancellationToken);
        }

        return false;
    }

    /// <summary>Polls Firestore every few minutes and tells players their tree can be watered / the box is ready.</summary>
    private async Task RunNotificationsAsync(CancellationToken cancellationToken)
    {
        var interval = TimeSpan.FromSeconds(configuration.GetValue("Notifications:IntervalSeconds", 300));
        var treeCooldown = configuration.GetValue("Tree:WateringCooldownSeconds", 6 * 60 * 60L);
        var boxCooldown = configuration.GetValue("Box:CooldownSeconds", 24 * 60 * 60L);

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var now = TimeProvider.System.GetUtcNow().ToUnixTimeSeconds();
                var due = await firestore!.GetDueNotificationsAsync(now, treeCooldown, boxCooldown, cancellationToken);

                foreach (var item in due)
                {
                    var treeDone = item.TreeWateredAt is null
                                   || await TrySendNotificationAsync(item.TelegramUserId, TreeReadyText, cancellationToken);
                    var boxDone = item.BoxOpenedAt is null
                                  || await TrySendNotificationAsync(item.TelegramUserId, BoxReadyText, cancellationToken);

                    // A failed send stays unmarked and is retried on the next pass.
                    await firestore.MarkNotifiedAsync(
                        item.TelegramUserId,
                        treeDone ? item.TreeWateredAt : null,
                        boxDone ? item.BoxOpenedAt : null,
                        cancellationToken);

                    await Task.Delay(TimeSpan.FromMilliseconds(50), cancellationToken);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning("Notification pass failed: {Error}", ex.Message);
            }

            try
            {
                await Task.Delay(interval, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    /// <returns>True when delivered or permanently undeliverable (blocked bot), false when worth retrying.</returns>
    private async Task<bool> TrySendNotificationAsync(long chatId, string text, CancellationToken cancellationToken)
    {
        var miniAppUrl = configuration["Telegram:MiniAppUrl"];
        object payload = string.IsNullOrWhiteSpace(miniAppUrl)
            ? new { chat_id = chatId, text }
            : new
            {
                chat_id = chatId,
                text,
                reply_markup = new
                {
                    inline_keyboard = new[]
                    {
                        new[] { new { text = "▶️ Грати", web_app = new { url = miniAppUrl } } }
                    }
                }
            };

        using var response = await _httpClient.PostAsJsonAsync("sendMessage", payload, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return true;
        }

        var status = (int)response.StatusCode;
        logger.LogInformation("Notification to {ChatId} failed: {Status}", chatId, status);
        // 400/403: the chat is gone or the player blocked the bot; retrying would only repeat the failure.
        return status is 400 or 403;
    }

    private async Task SendAdminKeyboardAsync(long chatId, CancellationToken cancellationToken)
    {
        using var response = await _httpClient.PostAsJsonAsync(
            "sendMessage",
            new
            {
                chat_id = chatId,
                text = "Адмін-панель: кнопка нижче створює пост для всіх гравців.",
                reply_markup = new
                {
                    keyboard = new[] { new[] { new { text = PostButtonText } } },
                    resize_keyboard = true,
                    is_persistent = true
                }
            },
            cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private async Task SendTextAsync(long chatId, string text, CancellationToken cancellationToken)
    {
        using var response = await _httpClient.PostAsJsonAsync(
            "sendMessage", new { chat_id = chatId, text }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public override void Dispose()
    {
        _httpClient.Dispose();
        base.Dispose();
    }

    private sealed record TelegramResponse<T>(bool Ok, T? Result);
    private sealed record TelegramUpdate([property: JsonPropertyName("update_id")] long UpdateId, TelegramMessage? Message,
        [property: JsonPropertyName("callback_query")] TelegramCallbackQuery? CallbackQuery);
    private sealed record TelegramCallbackQuery(string Id, string? Data, TelegramMessage? Message, TelegramUser From);
    private sealed record TelegramUser(long Id, string? Username);
    private sealed record TelegramMessage([property: JsonPropertyName("message_id")] long MessageId, string? Text,
        TelegramChat Chat, TelegramUser? From);
    private sealed record TelegramChat(long Id);
}
