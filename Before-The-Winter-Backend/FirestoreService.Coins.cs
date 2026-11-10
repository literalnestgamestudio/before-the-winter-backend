using Google.Cloud.Firestore;

namespace Everything_Lost_Backend;

internal sealed partial class FirestoreService
{
    /// <summary>Atomically increments the owned quantity, including legacy documents without a count.</summary>
    public Task<long> AddDecorationAsync(string userId, int decorationId, CancellationToken cancellationToken)
    {
        var document = db.Collection("Users").Document(userId).Collection("Decorations").Document(decorationId.ToString());
        return db.RunTransactionAsync(async transaction =>
        {
            var snapshot = await transaction.GetSnapshotAsync(document, cancellationToken);
            var current = snapshot.Exists
                ? snapshot.ContainsField("count") ? snapshot.GetValue<long>("count") : 1L
                : 0L;
            var count = checked(current + 1);
            transaction.Set(document, new Dictionary<string, object>
            {
                ["decorationId"] = decorationId,
                ["count"] = count
            }, SetOptions.MergeAll);
            return count;
        }, cancellationToken: cancellationToken);
    }

    /// <summary>The user document fields and every subcollection document, as JSON-friendly values.</summary>
    public async Task<Dictionary<string, object?>> GetUserDataAsync(string userId, CancellationToken cancellationToken)
    {
        var userDoc = db.Collection("Users").Document(userId);
        var snapshot = await userDoc.GetSnapshotAsync(cancellationToken);
        var collections = new Dictionary<string, object?>();
        await foreach (var collection in userDoc.ListCollectionsAsync().WithCancellation(cancellationToken))
        {
            var documents = new Dictionary<string, object?>();
            foreach (var document in (await collection.GetSnapshotAsync(cancellationToken)).Documents)
                documents[document.Id] = ToJsonValue(document.ToDictionary());
            collections[collection.Id] = documents;
        }

        return new Dictionary<string, object?>
        {
            ["userId"] = userId,
            ["fields"] = snapshot.Exists ? ToJsonValue(snapshot.ToDictionary()) : new Dictionary<string, object?>(),
            ["collections"] = collections
        };
    }

    private static object? ToJsonValue(object? value) => value switch
    {
        Timestamp timestamp => timestamp.ToDateTimeOffset().ToString("O"),
        IDictionary<string, object> map => map.ToDictionary(pair => pair.Key, pair => ToJsonValue(pair.Value)),
        System.Collections.IEnumerable list and not string => list.Cast<object?>().Select(ToJsonValue).ToList(),
        _ => value
    };

    /// <returns>The new coin balance, or null if the change would make it negative.</returns>
    public async Task<long?> ChangeCoinsAsync(string userId, long amount, CancellationToken cancellationToken)
    {
        var doc = db.Collection("Users").Document(userId);
        return await db.RunTransactionAsync<long?>(async transaction =>
        {
            var snapshot = await transaction.GetSnapshotAsync(doc, cancellationToken);
            var current = snapshot.Exists && snapshot.ContainsField("coins") ? snapshot.GetValue<long>("coins") : 0;
            long updated;
            try
            {
                updated = checked(current + amount);
            }
            catch (OverflowException)
            {
                return null;
            }

            if (updated < 0) return null;

            var fields = new Dictionary<string, object> { ["coins"] = updated };
            if (amount > 0)
            {
                // globalCoins is a lifetime total: it only grows when coins are added, never when they are spent.
                var globalCoins = snapshot.Exists && snapshot.ContainsField("globalCoins")
                    ? snapshot.GetValue<long>("globalCoins") : 0;
                try
                {
                    fields["globalCoins"] = checked(globalCoins + amount);
                }
                catch (OverflowException)
                {
                    return null;
                }
            }

            transaction.Set(doc, fields, SetOptions.MergeAll);
            return updated;
        }, cancellationToken: cancellationToken);
    }
}
