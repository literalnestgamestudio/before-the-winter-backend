using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Web;

namespace Everything_Lost_Backend;

internal sealed record TelegramUserProfile(long Id, string? Username, string DisplayName, string? PhotoUrl);

/// <summary>
/// Validates the signed <c>initData</c> string a Telegram Mini App receives, as described in
/// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app.
/// </summary>
internal static class TelegramInitData
{
    public static bool TryValidate(
        string initData, string botToken, TimeSpan maxAge, DateTimeOffset now,
        out TelegramUserProfile? profile, out string error)
    {
        profile = null;

        var fields = HttpUtility.ParseQueryString(initData);
        var hash = fields["hash"];
        if (string.IsNullOrEmpty(hash))
        {
            error = "initData has no hash.";
            return false;
        }

        var dataCheckString = string.Join('\n', fields.AllKeys
            .Where(key => key is not null && key != "hash")
            .OrderBy(key => key, StringComparer.Ordinal)
            .Select(key => $"{key}={fields[key]}"));

        var secretKey = HMACSHA256.HashData(Encoding.UTF8.GetBytes("WebAppData"), Encoding.UTF8.GetBytes(botToken));
        var expected = HMACSHA256.HashData(secretKey, Encoding.UTF8.GetBytes(dataCheckString));

        byte[] actual;
        try
        {
            actual = Convert.FromHexString(hash);
        }
        catch (FormatException)
        {
            error = "initData signature is malformed.";
            return false;
        }

        if (!CryptographicOperations.FixedTimeEquals(expected, actual))
        {
            error = "initData signature is invalid.";
            return false;
        }

        if (!long.TryParse(fields["auth_date"], out var authDateSeconds))
        {
            error = "initData has no auth_date.";
            return false;
        }

        if (now - DateTimeOffset.FromUnixTimeSeconds(authDateSeconds) > maxAge)
        {
            error = "initData has expired.";
            return false;
        }

        try
        {
            using var user = JsonDocument.Parse(fields["user"] ?? "");
            var userFields = user.RootElement;
            var id = userFields.GetProperty("id").GetInt64();
            var firstName = ReadString(userFields, "first_name");
            var lastName = ReadString(userFields, "last_name");
            profile = new TelegramUserProfile(id, ReadString(userFields, "username"),
                $"{firstName} {lastName}".Trim(), ReadString(userFields, "photo_url"));
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            error = "initData has no valid user.";
            return false;
        }

        error = "";
        return true;
    }

    private static string? ReadString(JsonElement value, string name)
        => value.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString() : null;
}
