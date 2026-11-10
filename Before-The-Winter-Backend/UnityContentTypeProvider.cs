using Microsoft.AspNetCore.StaticFiles;

namespace Everything_Lost_Backend;

/// <summary>
/// Resolves the content type of Unity WebGL files built with Brotli/Gzip compression
/// (e.g. "Build.wasm.br") from the extension underneath the compression suffix.
/// </summary>
internal sealed class UnityContentTypeProvider : IContentTypeProvider
{
    private readonly FileExtensionContentTypeProvider _inner = new()
    {
        Mappings =
        {
            [".data"] = "application/octet-stream",
            [".unityweb"] = "application/octet-stream"
        }
    };

    public bool TryGetContentType(string subpath, out string contentType)
    {
        foreach (var suffix in new[] { ".br", ".gz" })
        {
            if (subpath.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
            {
                subpath = subpath[..^suffix.Length];
                break;
            }
        }

        return _inner.TryGetContentType(subpath, out contentType!);
    }
}
