using Everything_Lost_Backend;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var firebaseCredentials = Path.GetFullPath(
    builder.Configuration["Firebase:CredentialsPath"] ?? "../everything-lost-firebase-adminsdk-fbsvc-02a6f76a65.json",
    builder.Environment.ContentRootPath);
if (File.Exists(firebaseCredentials))
{
    builder.Services.AddSingleton(_ => FirestoreService.Create(firebaseCredentials));
    builder.Services.AddSingleton<FirestoreService>(sp => new FirestoreService(sp.GetRequiredService<Google.Cloud.Firestore.FirestoreDb>()));
}

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<SessionService>();
builder.Services.AddSingleton<ChatHub>();

if (!string.IsNullOrWhiteSpace(builder.Configuration["Telegram:BotToken"]))
{
    builder.Services.AddHostedService<TelegramBotService>();
}

var app = builder.Build();

if (string.IsNullOrWhiteSpace(builder.Configuration["Telegram:BotToken"]))
{
    app.Logger.LogWarning("Telegram bot is disabled: Telegram:BotToken is not configured.");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Serves the Unity WebGL build (wwwroot/) as the Telegram Mini App.
// Brotli/Gzip builds are served pre-compressed: keep the original content type and add Content-Encoding.
var contentTypes = new UnityContentTypeProvider();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypes,
    OnPrepareResponse = context =>
    {
        var path = context.File.Name;
        if (path.EndsWith(".br", StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.Headers.ContentEncoding = "br";
        }
        else if (path.EndsWith(".gz", StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.Headers.ContentEncoding = "gzip";
        }
    }
});

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                (
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
            .ToArray();
        return forecast;
    })
    .WithName("GetWeatherForecast");

app.MapPost("/api/users/login", async (
    LoginRequest request, IServiceProvider services, IConfiguration configuration, SessionService sessions,
    IWebHostEnvironment environment, CancellationToken ct) =>
{
    if (RequireUser(request.UserId, services, out var firestore) is { } error) return error;
    if (string.IsNullOrWhiteSpace(request.DeviceId)) return Results.BadRequest(new { error = "deviceId is required." });

    var isEditorTestLogin = environment.IsDevelopment()
                            && configuration.GetValue("EditorLogin:Enabled", false)
                            && request.UserId?.Trim() == "-1"
                            && request.InitData == "unity-editor-test";
    if (string.IsNullOrWhiteSpace(request.InitData))
        return Results.BadRequest(new { error = "initData is required." });

    string userId;
    if (isEditorTestLogin)
    {
        userId = "-1";
    }
    else
    {
        var botToken = configuration["Telegram:BotToken"];
        if (string.IsNullOrWhiteSpace(botToken))
            return Results.Problem("Telegram bot token is not configured.", statusCode: 503);

        if (!TelegramInitData.TryValidate(
                request.InitData, botToken, TimeSpan.FromHours(24), TimeProvider.System.GetUtcNow(),
                out var telegramUserId, out var initDataError))
        {
            return Results.Json(new { error = initDataError }, statusCode: StatusCodes.Status401Unauthorized);
        }

        userId = telegramUserId.ToString();
        if (request.UserId!.Trim() != userId)
            return Results.Json(new { error = "userId does not match initData." }, statusCode: StatusCodes.Status403Forbidden);
    }

    var deviceId = request.DeviceId.Trim();
    var activeElsewhere = Results.Json(
        new { error = "The account is active on another device." }, statusCode: StatusCodes.Status409Conflict);
    if (sessions.IsActiveOnAnotherDevice(userId, deviceId)) return activeElsewhere;

    await firestore.UpdateLastLoginAsync(userId, request.Username, ct);

    var sessionId = sessions.TryStart(userId, deviceId);
    return sessionId is null
        ? activeElsewhere
        : Results.Ok(new { userId, sessionId, heartbeatIntervalSeconds = SessionService.HeartbeatIntervalSeconds });
});

app.MapPost("/api/users/session/heartbeat", (HeartbeatRequest request, SessionService sessions) =>
{
    if (string.IsNullOrWhiteSpace(request.SessionId)) return Results.BadRequest(new { error = "sessionId is required." });

    return sessions.Heartbeat(request.SessionId.Trim()) switch
    {
        HeartbeatResult.Ok => Results.Ok(new
        {
            request.SessionId,
            heartbeatIntervalSeconds = SessionService.HeartbeatIntervalSeconds
        }),
        HeartbeatResult.ActiveOnAnotherDevice => Results.Json(
            new { error = "The account is active on another device." }, statusCode: StatusCodes.Status409Conflict),
        _ => Results.NotFound(new { error = "Session not found." })
    };
});

// Editor-only controls for the currently authenticated test session.
if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/admin/reset-user", async (GrowthActionRequest request,
        [FromHeader(Name = "X-Session-Id")] string? sessionId,
        HttpContext context, IServiceProvider services, SessionService sessions, CancellationToken ct) =>
    {
        if (context.Connection.RemoteIpAddress is not { } address || !System.Net.IPAddress.IsLoopback(address))
            return Results.Forbid();
        if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
            return error;

        await firestore.ResetUserDataAsync(request.UserId!, ct);
        return Results.Ok(new { success = true });
    });

    app.MapPost("/api/admin/reset-box-timer", async (GrowthActionRequest request,
        [FromHeader(Name = "X-Session-Id")] string? sessionId,
        HttpContext context, IServiceProvider services, SessionService sessions, CancellationToken ct) =>
    {
        if (context.Connection.RemoteIpAddress is not { } address || !System.Net.IPAddress.IsLoopback(address))
            return Results.Forbid();
        if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
            return error;

        await firestore.ResetBoxTimerAsync(request.UserId!, ct);
        return Results.Ok(new { success = true });
    });

    app.MapPost("/api/admin/reset-tree-watering-timer", async (GrowthActionRequest request,
        [FromHeader(Name = "X-Session-Id")] string? sessionId,
        HttpContext context, IServiceProvider services, SessionService sessions, CancellationToken ct) =>
    {
        if (context.Connection.RemoteIpAddress is not { } address || !System.Net.IPAddress.IsLoopback(address))
            return Results.Forbid();
        if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
            return error;

        await firestore.ResetTreeWateringTimerAsync(request.UserId!, ct);
        return Results.Ok(new { success = true });
    });

    app.MapPost("/api/admin/advance-tree-stage", async (GrowthActionRequest request,
        [FromHeader(Name = "X-Session-Id")] string? sessionId,
        HttpContext context, IServiceProvider services, SessionService sessions, CancellationToken ct) =>
    {
        if (context.Connection.RemoteIpAddress is not { } address || !System.Net.IPAddress.IsLoopback(address))
            return Results.Forbid();
        if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
            return error;

        var (wateredTimesAmount, stage) = await firestore.AdvanceTreeStageAsync(request.UserId!, ct);
        return Results.Ok(new { wateredTimesAmount, stage });
    });
}

const int MaxChatMessageLength = 500;
const int MaxChatMessagesPerRequest = 100;

app.MapGet("/api/users/username/{telegramId}", async (string telegramId, string? userId,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(userId, sessionId, services, sessions, out var firestore) is { } error)
        return error;
    if (string.IsNullOrWhiteSpace(telegramId))
        return Results.BadRequest(new { error = "telegramId is required." });
    var username = await firestore.GetTelegramUsernameAsync(telegramId.Trim(), ct);
    return username is null
        ? Results.NotFound(new { error = "Username not found." })
        : Results.Ok(new { userId = telegramId.Trim(), username });
});

app.MapPost("/api/coins/change", async (ChangeCoinsRequest request,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    var coinsAmount = await firestore.ChangeCoinsAsync(request.UserId!, request.Amount, ct);
    return coinsAmount is null
        ? Results.BadRequest(new { error = "Not enough coins." })
        : Results.Ok(new { userId = request.UserId, coinsAmount });
});

app.MapGet("/api/users/data/{userId}", async (string userId,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(userId, sessionId, services, sessions, out var firestore) is { } error)
        return error;
    return Results.Ok(await firestore.GetUserDataAsync(userId, ct));
});

app.MapPost("/api/box/set-opened", async (GrowthActionRequest request,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, TimeProvider time, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    var now = time.GetUtcNow().ToUnixTimeSeconds();
    await firestore.SetBoxOpenedAsync(request.UserId!, now, ct);
    return Results.Ok(new { userId = request.UserId, boxOpenedAtUnixSeconds = now });
});

app.MapGet("/api/box/paid-price/{userId}", async (string userId,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, IConfiguration configuration, TimeProvider time,
    CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(userId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    var (day, secondsUntilReset) = GetPaidBoxDay(configuration, time);
    var price = await firestore.GetPaidBoxPriceAsync(userId, day, ct);
    return Results.Ok(new { price, secondsUntilReset });
});

app.MapPost("/api/box/purchase", async (GrowthActionRequest request,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, IConfiguration configuration, TimeProvider time,
    CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    var (day, secondsUntilReset) = GetPaidBoxDay(configuration, time);
    var result = await firestore.PurchasePaidBoxAsync(request.UserId!, day, ct);
    return result is null
        ? Results.BadRequest(new { error = "Not enough coins." })
        : Results.Ok(new { coinsAmount = result.Value.Balance, nextPrice = result.Value.NextPrice,
            secondsUntilReset });
});

app.MapGet("/api/box/remaining-time/{userId}", async (string userId,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, IConfiguration configuration, TimeProvider time,
    CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(userId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    var cooldownSeconds = configuration.GetValue("Box:CooldownSeconds", 24 * 60 * 60L);
    var openedAt = await firestore.GetBoxOpenedAtAsync(userId, ct);
    var now = time.GetUtcNow().ToUnixTimeSeconds();
    var remaining = openedAt == 0 ? TimeSpan.Zero : TimeSpan.FromSeconds(Math.Max(0, openedAt + cooldownSeconds - now));
    return Results.Ok(new
    {
        remainingSeconds = (long)remaining.TotalSeconds,
        days = remaining.Days,
        hours = remaining.Hours,
        minutes = remaining.Minutes,
        seconds = remaining.Seconds,
        boxOpenedAtUnixSeconds = openedAt,
        serverNowUnixSeconds = now
    });
});

app.MapPost("/api/tree/set-watered", async (GrowthActionRequest request,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, TimeProvider time, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    var now = time.GetUtcNow().ToUnixTimeSeconds();
    var wateredTimesAmount = await firestore.SetTreeWateredAsync(request.UserId!, now, ct);
    return Results.Ok(new { userId = request.UserId, treeWateredAtUnixSeconds = now, wateredTimesAmount });
});

app.MapGet("/api/tree/watering-remaining-time/{userId}", async (string userId,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, IConfiguration configuration, TimeProvider time,
    CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(userId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    var cooldownSeconds = configuration.GetValue("Tree:WateringCooldownSeconds", 6 * 60 * 60L);
    var wateredAt = await firestore.GetTreeWateredAtAsync(userId, ct);
    var now = time.GetUtcNow().ToUnixTimeSeconds();
    var remaining = wateredAt == 0 ? TimeSpan.Zero : TimeSpan.FromSeconds(Math.Max(0, wateredAt + cooldownSeconds - now));
    return Results.Ok(new
    {
        remainingSeconds = (long)remaining.TotalSeconds,
        days = remaining.Days,
        hours = remaining.Hours,
        minutes = remaining.Minutes,
        seconds = remaining.Seconds,
        treeWateredAtUnixSeconds = wateredAt,
        serverNowUnixSeconds = now
    });
});

app.MapGet("/api/tree/watered-times/{userId}", async (string userId,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(userId, sessionId, services, sessions, out var firestore) is { } error)
        return error;

    return Results.Ok(new { userId, wateredTimesAmount = await firestore.GetWateredTimesAmountAsync(userId, ct) });
});

app.MapPost("/api/decorations/add", async (AddDecorationRequest request,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
        return error;
    if (request.DecorationId < 0)
        return Results.BadRequest(new { error = "decorationId must not be negative." });

    var count = await firestore.AddDecorationAsync(request.UserId!, request.DecorationId, ct);
    return Results.Ok(new { userId = request.UserId, decorationId = request.DecorationId, count });
});

app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(30) });

var chat = app.MapGroup("/api/chat");

// Browsers cannot set headers on a WebSocket, so the session id goes in the query string.
chat.MapGet("/ws", async (HttpContext context, string? userId, string? sessionId,
    SessionService sessions, ChatHub hub) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
        return Results.BadRequest(new { error = "WebSocket request expected." });
    if (string.IsNullOrWhiteSpace(userId))
        return Results.BadRequest(new { error = "userId is required." });
    if (string.IsNullOrWhiteSpace(sessionId) || !sessions.IsValidSession(sessionId.Trim(), userId))
        return Results.Unauthorized();

    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    await hub.RunAsync(socket, () => sessions.IsValidSession(sessionId.Trim(), userId), context.RequestAborted);
    return Results.Empty;
});

chat.MapGet("/messages/{userId}", async (string userId, int? limit,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(userId, sessionId, services, sessions, out var firestore) is { } error)
        return error;
    var messages = await firestore.GetChatMessagesAsync(Math.Clamp(limit ?? 50, 1, MaxChatMessagesPerRequest), ct);
    return Results.Ok(messages.Select(m => new
    {
        userId = m.UserId,
        message = m.Message,
        sentAtUnixSeconds = m.SentAtUnixSeconds
    }));
});

chat.MapPost("/message", async (ChatMessageRequest request,
    [FromHeader(Name = "X-Session-Id")] string? sessionId,
    IServiceProvider services, SessionService sessions, TimeProvider time, ChatHub hub, CancellationToken ct) =>
{
    if (RequireTreeGrowthSession(request.UserId, sessionId, services, sessions, out var firestore) is { } error)
        return error;
    var message = request.Message?.Trim();
    if (string.IsNullOrEmpty(message) || message.Length > MaxChatMessageLength)
        return Results.BadRequest(new { error = $"message must be 1-{MaxChatMessageLength} characters." });
    var saved = await firestore.AddChatMessageAsync(request.UserId!, message, time.GetUtcNow().ToUnixTimeSeconds(), ct);
    await hub.BroadcastAsync(saved);
    return Results.Ok(new
    {
        userId = saved.UserId,
        message = saved.Message,
        sentAtUnixSeconds = saved.SentAtUnixSeconds
    });
});

app.Run();

static (string Day, long SecondsUntilReset) GetPaidBoxDay(IConfiguration configuration, TimeProvider time)
{
    var zoneId = configuration["Box:PriceResetTimeZone"] ?? "Europe/Kyiv";
    var zone = TimeZoneInfo.FindSystemTimeZoneById(zoneId);
    var now = time.GetUtcNow();
    var local = TimeZoneInfo.ConvertTime(now, zone);
    var tomorrow = DateOnly.FromDateTime(local.DateTime).AddDays(1);
    var nextMidnight = TimeZoneInfo.ConvertTimeToUtc(tomorrow.ToDateTime(TimeOnly.MinValue), zone);
    return (DateOnly.FromDateTime(local.DateTime).ToString("yyyy-MM-dd"),
        Math.Max(1, (long)Math.Ceiling((nextMidnight - now.UtcDateTime).TotalSeconds)));
}

static IResult? RequireUser(string? userId, IServiceProvider services, out FirestoreService firestore)
{
    firestore = services.GetService<FirestoreService>()!;
    if (firestore is null) return Results.Problem("Firebase is not configured.", statusCode: 503);
    if (string.IsNullOrWhiteSpace(userId)) return Results.BadRequest(new { error = "userId is required." });
    return null;
}

static IResult? RequireTreeGrowthSession(string? userId, string? sessionId, IServiceProvider services,
    SessionService sessions, out FirestoreService firestore)
{
    var error = RequireUser(userId, services, out firestore);
    if (error is not null)
        return error;
    if (string.IsNullOrWhiteSpace(sessionId) || !sessions.IsValidSession(sessionId.Trim(), userId!))
        return Results.Unauthorized();
    return null;
}

record LoginRequest(string? UserId, string? Username, string? InitData, string? DeviceId);

record HeartbeatRequest(string? SessionId);

record GrowthActionRequest(string? UserId);

record ChangeCoinsRequest(string? UserId, long Amount);

record AddDecorationRequest(string? UserId, int DecorationId);

record ChatMessageRequest(string? UserId, string? Message);

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
