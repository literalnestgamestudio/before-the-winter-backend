using Google.Cloud.Firestore;

namespace Everything_Lost_Backend;

internal sealed record ChatMessage(string UserId, string Message, long SentAtUnixSeconds);

internal sealed record LeaderboardEntry(string? Username, long GlobalCoins);

internal sealed partial class FirestoreService
{
    private const int MaxStoredChatMessages = 100;
    private const long MaxChatMessageAgeSeconds = 3 * 24 * 60 * 60;

    private CollectionReference ChatMessages => db.Collection("ChatMessages");

    public async Task<ChatMessage> AddChatMessageAsync(string userId, string message, long sentAtUnixSeconds,
        CancellationToken cancellationToken)
    {
        await ChatMessages.AddAsync(new Dictionary<string, object>
        {
            ["userId"] = userId,
            ["message"] = message,
            ["sentAtUnixSeconds"] = sentAtUnixSeconds
        }, cancellationToken);

        // Keep only the latest MaxStoredChatMessages messages, none older than MaxChatMessageAgeSeconds.
        var tooMany = await ChatMessages.OrderByDescending("sentAtUnixSeconds").Offset(MaxStoredChatMessages)
            .GetSnapshotAsync(cancellationToken);
        var tooOld = await ChatMessages.WhereLessThan("sentAtUnixSeconds", sentAtUnixSeconds - MaxChatMessageAgeSeconds)
            .GetSnapshotAsync(cancellationToken);
        var stale = tooMany.Documents.Concat(tooOld.Documents).DistinctBy(d => d.Id).ToList();
        foreach (var chunk in stale.Chunk(400))
        {
            var batch = db.StartBatch();
            foreach (var document in chunk) batch.Delete(document.Reference);
            await batch.CommitAsync(cancellationToken);
        }

        return new ChatMessage(userId, message, sentAtUnixSeconds);
    }

    /// <returns>The Telegram username saved at login, or null if the user or username is unknown.</returns>
    public async Task<string?> GetTelegramUsernameAsync(string userId, CancellationToken cancellationToken)
    {
        var snapshot = await db.Collection("Users").Document(userId).GetSnapshotAsync(cancellationToken);
        return snapshot.Exists && snapshot.ContainsField("telegramUsername")
            ? snapshot.GetValue<string>("telegramUsername")
            : null;
    }

    /// <returns>The users with the most globalCoins collected, best first. Users without globalCoins are not ranked.</returns>
    public async Task<IReadOnlyList<LeaderboardEntry>> GetLeaderboardAsync(
        int limit, IReadOnlyCollection<string> excludedUserIds, CancellationToken cancellationToken)
    {
        // Over-fetch by the number of excluded users so the list still has `limit` entries after filtering.
        var snapshot = await db.Collection("Users").OrderByDescending("globalCoins")
            .Limit(limit + excludedUserIds.Count).GetSnapshotAsync(cancellationToken);
        return snapshot.Documents
            .Where(d => !excludedUserIds.Contains(d.Id))
            .Take(limit)
            .Select(d => new LeaderboardEntry(
                d.ContainsField("telegramUsername") ? d.GetValue<string>("telegramUsername") : null,
                d.GetValue<long>("globalCoins")))
            .ToList();
    }

    /// <returns>The latest messages, oldest first.</returns>
    public async Task<IReadOnlyList<ChatMessage>> GetChatMessagesAsync(int limit, CancellationToken cancellationToken)
    {
        var oldest = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - MaxChatMessageAgeSeconds;
        var snapshot = await ChatMessages.WhereGreaterThanOrEqualTo("sentAtUnixSeconds", oldest)
            .OrderByDescending("sentAtUnixSeconds").Limit(limit).GetSnapshotAsync(cancellationToken);
        return snapshot.Documents
            .Select(d => new ChatMessage(d.GetValue<string>("userId"), d.GetValue<string>("message"),
                d.GetValue<long>("sentAtUnixSeconds")))
            .Reverse()
            .ToList();
    }
}
