using Google.Cloud.Firestore;

namespace Everything_Lost_Backend;

internal sealed partial class FirestoreService
{
    public async Task<List<PlacedDecoration>> GetPlacedDecorationsAsync(string userId, CancellationToken ct)
    {
        var document = db.Collection("Users").Document(userId).Collection("TreeDecorations").Document("layout");
        var snapshot = await document.GetSnapshotAsync(ct);
        if (!snapshot.Exists || !snapshot.ContainsField("items")) return [];
        var result = new List<PlacedDecoration>();
        foreach (var value in (List<object>)snapshot.ToDictionary()["items"])
        {
            var item = (Dictionary<string, object>)value;
            result.Add(new PlacedDecoration(Convert.ToInt32(item["decorationId"]),
                Convert.ToDouble(item["x"]), Convert.ToDouble(item["y"])));
        }
        return result;
    }

    public Task<bool> SavePlacedDecorationsAsync(string userId, List<PlacedDecoration> items, CancellationToken ct)
    {
        var user = db.Collection("Users").Document(userId);
        var owned = user.Collection("Decorations");
        var layout = user.Collection("TreeDecorations").Document("layout");
        return db.RunTransactionAsync(async transaction =>
        {
            foreach (var group in items.GroupBy(item => item.DecorationId))
            {
                var snapshot = await transaction.GetSnapshotAsync(owned.Document(group.Key.ToString()), ct);
                var count = !snapshot.Exists ? 0 : snapshot.ContainsField("count")
                    ? snapshot.GetValue<long>("count") : 1;
                if (group.Count() > count) return false;
            }
            transaction.Set(layout, new Dictionary<string, object>
            {
                ["items"] = items.Select(item => new Dictionary<string, object>
                {
                    ["decorationId"] = item.DecorationId, ["x"] = item.X, ["y"] = item.Y
                }).ToList()
            });
            return true;
        }, cancellationToken: ct);
    }
}
