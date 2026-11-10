using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Web;

namespace Everything_Lost_Backend;

/// <summary>
/// Validates the signed <c>initData</c> string a Telegram Mini App receives, as described in
/// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app.
/// </summary>
internal static class TelegramInitData
{
    public static bool TryValidate(
        string initData, string botToken, TimeSpan maxAge, DateTimeOffset now, out long userId, out string error)
    {
        userId = 0;

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
            userId = user.RootElement.GetProperty("id").GetInt64();
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            error = "initData has no valid user.";
            return false;
        }

        error = "";
        return true;
    }
}
