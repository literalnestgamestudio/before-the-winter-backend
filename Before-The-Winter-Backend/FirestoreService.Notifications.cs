using Google.Cloud.Firestore;

namespace Everything_Lost_Backend;

internal sealed record DueNotification(long TelegramUserId, long? TreeWateredAt, long? BoxOpenedAt);

internal sealed partial class FirestoreService
{
    private static long ReadLong(DocumentSnapshot snapshot, string field) =>
        snapshot.TryGetValue<long>(field, out var value) ? value : 0;

    /// <summary>
    /// Players whose tree watering or box cooldown has elapsed and who were not told about that exact timestamp yet.
    /// Timers that were never started or were reset to 0 are skipped.
    /// </summary>
    public async Task<IReadOnlyList<DueNotification>> GetDueNotificationsAsync(
        long nowUnixSeconds, long treeCooldownSeconds, long boxCooldownSeconds, CancellationToken cancellationToken)
    {
        var due = new List<DueNotification>();
        await foreach (var snapshot in db.Collection("Users").StreamAsync().WithCancellation(cancellationToken))
        {
            if (!long.TryParse(snapshot.Id, out var telegramUserId) || telegramUserId <= 0)
            {
                continue;
            }

            long? tree = null, box = null;

            var wateredAt = ReadLong(snapshot, "treeWateredAtUnixSeconds");
            if (wateredAt > 0 && wateredAt + treeCooldownSeconds <= nowUnixSeconds
                              && ReadLong(snapshot, "treeNotifiedForUnixSeconds") != wateredAt)
            {
                tree = wateredAt;
            }

            var openedAt = ReadLong(snapshot, "boxOpenedAtUnixSeconds");
            if (openedAt > 0 && openedAt + boxCooldownSeconds <= nowUnixSeconds
                             && ReadLong(snapshot, "boxNotifiedForUnixSeconds") != openedAt)
            {
                box = openedAt;
            }

            if (tree is not null || box is not null)
            {
                due.Add(new DueNotification(telegramUserId, tree, box));
            }
        }

        return due;
    }

    /// <summary>Remembers which timer value the player was notified about, so it is announced only once.</summary>
    public async Task MarkNotifiedAsync(long telegramUserId, long? treeWateredAt, long? boxOpenedAt,
        CancellationToken cancellationToken)
    {
        var data = new Dictionary<string, object>();
        if (treeWateredAt is { } tree) data["treeNotifiedForUnixSeconds"] = tree;
        if (boxOpenedAt is { } box) data["boxNotifiedForUnixSeconds"] = box;
        if (data.Count == 0) return;

        await db.Collection("Users").Document(telegramUserId.ToString())
            .SetAsync(data, SetOptions.MergeAll, cancellationToken);
    }
}
