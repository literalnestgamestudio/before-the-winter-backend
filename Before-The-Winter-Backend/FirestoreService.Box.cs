using Google.Cloud.Firestore;

namespace Everything_Lost_Backend;

internal sealed partial class FirestoreService
{
    private const long PaidBoxBasePrice = 150;
    private const long PaidBoxMaximumPrice = 1_000_000;

    private static long PaidBoxPrice(long purchasesToday)
    {
        var raw = Math.Min(PaidBoxMaximumPrice, PaidBoxBasePrice * Math.Pow(1.35, purchasesToday));
        return Math.Min(PaidBoxMaximumPrice, (long)Math.Round(raw / 5, MidpointRounding.AwayFromZero) * 5);
    }

    public async Task<long> GetPaidBoxPriceAsync(string userId, string dayKey, CancellationToken cancellationToken)
    {
        var snapshot = await db.Collection("Users").Document(userId).GetSnapshotAsync(cancellationToken);
        var count = snapshot.Exists && snapshot.ContainsField("paidBoxDay") &&
                    snapshot.GetValue<string>("paidBoxDay") == dayKey && snapshot.ContainsField("paidBoxCount")
            ? snapshot.GetValue<long>("paidBoxCount") : 0;
        return PaidBoxPrice(count);
    }

    public async Task<(long Balance, long NextPrice)?> PurchasePaidBoxAsync(
        string userId, string dayKey, CancellationToken cancellationToken)
    {
        var doc = db.Collection("Users").Document(userId);
        return await db.RunTransactionAsync<(long Balance, long NextPrice)?>(async transaction =>
        {
            var snapshot = await transaction.GetSnapshotAsync(doc, cancellationToken);
            var count = snapshot.Exists && snapshot.ContainsField("paidBoxDay") &&
                        snapshot.GetValue<string>("paidBoxDay") == dayKey && snapshot.ContainsField("paidBoxCount")
                ? snapshot.GetValue<long>("paidBoxCount") : 0;
            var balance = snapshot.Exists && snapshot.ContainsField("coins")
                ? snapshot.GetValue<long>("coins") : 0;
            var price = PaidBoxPrice(count);
            if (balance < price) return null;
            var nextCount = count + 1;
            var updated = balance - price;
            transaction.Set(doc, new Dictionary<string, object>
            {
                ["coins"] = updated,
                ["paidBoxDay"] = dayKey,
                ["paidBoxCount"] = nextCount
            }, SetOptions.MergeAll);
            return (updated, PaidBoxPrice(nextCount));
        }, cancellationToken: cancellationToken);
    }

    private async Task SetUserTimestampAsync(string userId, string field, long unixSeconds, CancellationToken cancellationToken)
    {
        await db.Collection("Users").Document(userId).SetAsync(
            new Dictionary<string, object> { [field] = unixSeconds }, SetOptions.MergeAll, cancellationToken);
    }

    /// <returns>The stored Unix seconds, or 0 if the field was never set.</returns>
    private async Task<long> GetUserTimestampAsync(string userId, string field, CancellationToken cancellationToken)
    {
        var snapshot = await db.Collection("Users").Document(userId).GetSnapshotAsync(cancellationToken);
        return snapshot.Exists && snapshot.ContainsField(field) ? snapshot.GetValue<long>(field) : 0;
    }

    public Task SetBoxOpenedAsync(string userId, long openedAtUnixSeconds, CancellationToken cancellationToken) =>
        SetUserTimestampAsync(userId, "boxOpenedAtUnixSeconds", openedAtUnixSeconds, cancellationToken);

    public Task ResetBoxTimerAsync(string userId, CancellationToken cancellationToken) =>
        SetUserTimestampAsync(userId, "boxOpenedAtUnixSeconds", 0, cancellationToken);

    /// <returns>When the box was last opened (Unix seconds), or 0 if it never was.</returns>
    public Task<long> GetBoxOpenedAtAsync(string userId, CancellationToken cancellationToken) =>
        GetUserTimestampAsync(userId, "boxOpenedAtUnixSeconds", cancellationToken);

    /// <returns>How many times the tree was watered, or 0 if never.</returns>
    public Task<long> GetWateredTimesAmountAsync(string userId, CancellationToken cancellationToken) =>
        GetUserTimestampAsync(userId, "wateredTimesAmount", cancellationToken);

    /// <summary>Stores the watering time and increments wateredTimesAmount in one transaction.</summary>
    /// <returns>The new wateredTimesAmount.</returns>
    public async Task<long> SetTreeWateredAsync(string userId, long wateredAtUnixSeconds, CancellationToken cancellationToken)
    {
        var doc = db.Collection("Users").Document(userId);
        return await db.RunTransactionAsync(async transaction =>
        {
            var snapshot = await transaction.GetSnapshotAsync(doc, cancellationToken);
            var times = (snapshot.Exists && snapshot.ContainsField("wateredTimesAmount")
                ? snapshot.GetValue<long>("wateredTimesAmount")
                : 0) + 1;
            transaction.Set(doc, new Dictionary<string, object>
            {
                ["treeWateredAtUnixSeconds"] = wateredAtUnixSeconds,
                ["wateredTimesAmount"] = times
            }, SetOptions.MergeAll);
            return times;
        }, cancellationToken: cancellationToken);
    }

    /// <returns>When the tree was last watered (Unix seconds), or 0 if it never was.</returns>
    public Task<long> GetTreeWateredAtAsync(string userId, CancellationToken cancellationToken) =>
        GetUserTimestampAsync(userId, "treeWateredAtUnixSeconds", cancellationToken);

    public Task ResetTreeWateringTimerAsync(string userId, CancellationToken cancellationToken) =>
        SetUserTimestampAsync(userId, "treeWateredAtUnixSeconds", 0, cancellationToken);

    /// <returns>The watering count and stage after advancing to the next stage.</returns>
    public async Task<(long WateredTimesAmount, int Stage)> AdvanceTreeStageAsync(
        string userId, CancellationToken cancellationToken)
    {
        long[] thresholds = { 0, 1, 2, 4, 6, 9, 14, 21, 32, 50 };
        var doc = db.Collection("Users").Document(userId);
        return await db.RunTransactionAsync(async transaction =>
        {
            var snapshot = await transaction.GetSnapshotAsync(doc, cancellationToken);
            var count = snapshot.Exists && snapshot.ContainsField("wateredTimesAmount")
                ? snapshot.GetValue<long>("wateredTimesAmount") : 0;
            var stage = 1;
            for (var i = 1; i < thresholds.Length; i++)
            {
                if (count < thresholds[i])
                {
                    count = thresholds[i];
                    stage = i + 1;
                    transaction.Set(doc, new Dictionary<string, object>
                    {
                        ["wateredTimesAmount"] = count
                    }, SetOptions.MergeAll);
                    return (count, stage);
                }
            }

            return (count, thresholds.Length);
        }, cancellationToken: cancellationToken);
    }
}
