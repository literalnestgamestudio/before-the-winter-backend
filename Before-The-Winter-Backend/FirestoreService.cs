using System.Text.Json;
using Google.Cloud.Firestore;

namespace Everything_Lost_Backend;

internal sealed partial class FirestoreService(FirestoreDb db)
{
    public static FirestoreDb Create(string credentialsPath)
    {
        using var stream = File.OpenRead(credentialsPath);
        using var json = JsonDocument.Parse(stream);
        var projectId = json.RootElement.GetProperty("project_id").GetString()!;

        return new FirestoreDbBuilder
        {
            ProjectId = projectId,
            CredentialsPath = credentialsPath
        }.Build();
    }

    public async Task<string> WriteTestDocumentAsync(long chatId, CancellationToken cancellationToken)
    {
        var reference = await db.Collection("test").AddAsync(new Dictionary<string, object>
        {
            ["message"] = "Hello from Everything-Lost-Backend",
            ["chatId"] = chatId,
            ["createdAt"] = FieldValue.ServerTimestamp
        }, cancellationToken);

        return reference.Id;
    }

    public Task ResetUserDataAsync(string userId, CancellationToken cancellationToken) =>
        DeleteDocumentTreeAsync(db.Collection("Users").Document(userId), cancellationToken);

    private static async Task DeleteDocumentTreeAsync(DocumentReference document, CancellationToken cancellationToken)
    {
        await foreach (var collection in document.ListCollectionsAsync().WithCancellation(cancellationToken))
        {
            await foreach (var child in collection.ListDocumentsAsync().WithCancellation(cancellationToken))
                await DeleteDocumentTreeAsync(child, cancellationToken);
        }

        await document.DeleteAsync(cancellationToken: cancellationToken);
    }

    public async Task UpdateLastLoginAsync(string userId, string? telegramUsername, CancellationToken cancellationToken)
    {
        var data = new Dictionary<string, object>
        {
            ["lastLoginAt"] = FieldValue.ServerTimestamp
        };
        if (!string.IsNullOrWhiteSpace(telegramUsername))
        {
            data["telegramUsername"] = telegramUsername;
        }

        await db.Collection("Users").Document(userId).SetAsync(data, SetOptions.MergeAll, cancellationToken);
    }

    /// <summary>Telegram ids of all players (the Users document ids), excluding the editor test user.</summary>
    public async Task<IReadOnlyList<long>> GetTelegramUserIdsAsync(CancellationToken cancellationToken)
    {
        var ids = new List<long>();
        // ListDocuments also returns players that only have subcollections and no fields on the document itself.
        await foreach (var document in db.Collection("Users").ListDocumentsAsync().WithCancellation(cancellationToken))
        {
            if (long.TryParse(document.Id, out var id) && id > 0)
            {
                ids.Add(id);
            }
        }

        return ids;
    }

    public async Task SaveUserAsync(long telegramUserId, string? telegramUsername, CancellationToken cancellationToken)
    {
        await db.Collection("Users").Document(telegramUserId.ToString()).SetAsync(
            new Dictionary<string, object?>
            {
                ["telegramUserId"] = telegramUserId,
                ["telegramUsername"] = telegramUsername,
                ["updatedAt"] = FieldValue.ServerTimestamp
            },
            SetOptions.MergeAll,
            cancellationToken);
    }
}
