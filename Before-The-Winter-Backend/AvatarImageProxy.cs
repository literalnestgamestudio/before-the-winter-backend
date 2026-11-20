using System.Net;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using SkiaSharp;
using Svg.Skia;

namespace Everything_Lost_Backend;

internal sealed class AvatarImageProxy(HttpClient client, IMemoryCache cache, ILogger<AvatarImageProxy> logger)
{
    private const int MaxImageBytes = 2 * 1024 * 1024;
    private const int AvatarSize = 320;

    public async Task<byte[]?> GetPngAsync(string url, string? avatarRefresh, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || !IsAllowed(uri))
            return null;

        var cacheKey = avatarRefresh is { Length: > 0 and <= 32 } ? $"{url}|{avatarRefresh}" : url;
        if (cache.TryGetValue<byte[]>(cacheKey, out var cached))
            return cached;

        for (var redirects = 0; redirects < 3; redirects++)
        {
            using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (response.StatusCode is HttpStatusCode.MovedPermanently or HttpStatusCode.Redirect
                or HttpStatusCode.TemporaryRedirect or HttpStatusCode.PermanentRedirect)
            {
                var location = response.Headers.Location;
                if (location == null) return null;
                uri = location.IsAbsoluteUri ? location : new Uri(uri, location);
                if (!IsAllowed(uri)) return null;
                continue;
            }

            if (!response.IsSuccessStatusCode || response.Content.Headers.ContentLength > MaxImageBytes)
                return null;

            await using var body = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var buffer = new MemoryStream();
            var chunk = new byte[16 * 1024];
            int read;
            while ((read = await body.ReadAsync(chunk, cancellationToken)) > 0)
            {
                if (buffer.Length + read > MaxImageBytes) return null;
                buffer.Write(chunk, 0, read);
            }

            try
            {
                var source = buffer.ToArray();
                byte[]? png;
                if (response.Content.Headers.ContentType?.MediaType == "image/svg+xml")
                {
                    using var svg = new SKSvg();
                    var picture = svg.FromSvg(Encoding.UTF8.GetString(source));
                    if (picture == null) return null;

                    using var surface = SKSurface.Create(new SKImageInfo(AvatarSize, AvatarSize));
                    surface.Canvas.Clear(SKColors.Transparent);
                    var bounds = picture.CullRect;
                    if (bounds.Width <= 0 || bounds.Height <= 0) return null;
                    surface.Canvas.Scale(AvatarSize / bounds.Width, AvatarSize / bounds.Height);
                    surface.Canvas.Translate(-bounds.Left, -bounds.Top);
                    surface.Canvas.DrawPicture(picture);
                    using var image = surface.Snapshot();
                    using var encoded = image.Encode(SKEncodedImageFormat.Png, 100);
                    png = encoded?.ToArray();
                }
                else
                {
                    using var bitmap = SKBitmap.Decode(source);
                    if (bitmap == null) return null;
                    using var image = SKImage.FromBitmap(bitmap);
                    using var encoded = image.Encode(SKEncodedImageFormat.Png, 100);
                    png = encoded?.ToArray();
                }

                if (png == null) return null;
                cache.Set(cacheKey, png, TimeSpan.FromHours(24));
                return png;
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Failed to decode Telegram avatar from {Host}", uri.Host);
                return null;
            }
        }

        return null;
    }

    private static bool IsAllowed(Uri uri) =>
        uri.Scheme == Uri.UriSchemeHttps && uri.IsDefaultPort && uri.UserInfo.Length == 0 &&
        (uri.Host == "t.me" || uri.Host == "telegram.org" ||
         uri.Host.EndsWith(".telegram.org", StringComparison.Ordinal) ||
         uri.Host.EndsWith(".telesco.pe", StringComparison.Ordinal));
}
