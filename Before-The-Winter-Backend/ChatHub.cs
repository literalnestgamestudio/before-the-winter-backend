using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text.Json;

namespace Everything_Lost_Backend;

/// <summary>Keeps open chat WebSocket connections and pushes new messages to all of them.</summary>
internal sealed class ChatHub(ILogger<ChatHub> logger)
{
    private sealed record Client(WebSocket Socket, SemaphoreSlim SendLock);

    private static readonly TimeSpan SessionCheckInterval = TimeSpan.FromSeconds(5);

    private readonly ConcurrentDictionary<Guid, Client> _clients = new();

    /// <summary>
    /// Registers the socket and returns when it closes. The socket is closed with a policy-violation
    /// status as soon as <paramref name="isSessionValid"/> turns false.
    /// </summary>
    public async Task RunAsync(WebSocket socket, Func<bool> isSessionValid, CancellationToken cancellationToken)
    {
        var id = Guid.NewGuid();
        var client = new Client(socket, new SemaphoreSlim(1, 1));
        _clients[id] = client;
        using var stop = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        var monitor = MonitorSessionAsync(client, isSessionValid, stop);
        try
        {
            // Clients only receive; incoming frames are read and dropped so close frames get processed.
            var buffer = new byte[256];
            while (socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(buffer, stop.Token);
                if (result.MessageType == WebSocketMessageType.Close) break;
            }

            if (socket.State == WebSocketState.CloseReceived)
                await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, null, CancellationToken.None);
        }
        catch (Exception e) when (e is WebSocketException or OperationCanceledException)
        {
        }
        finally
        {
            stop.Cancel();
            await monitor;
            _clients.TryRemove(id, out _);
        }
    }

    private static async Task MonitorSessionAsync(Client client, Func<bool> isSessionValid, CancellationTokenSource stop)
    {
        try
        {
            while (true)
            {
                await Task.Delay(SessionCheckInterval, stop.Token);
                if (isSessionValid()) continue;

                await client.SendLock.WaitAsync(CancellationToken.None);
                try
                {
                    if (client.Socket.State == WebSocketState.Open)
                        await client.Socket.CloseOutputAsync(WebSocketCloseStatus.PolicyViolation, "session expired", CancellationToken.None);
                }
                finally
                {
                    client.SendLock.Release();
                }

                // Give the client a moment to answer the close frame, then end the receive loop.
                await Task.Delay(TimeSpan.FromSeconds(2), stop.Token);
                stop.Cancel();
                return;
            }
        }
        catch (Exception e) when (e is WebSocketException or OperationCanceledException)
        {
        }
    }

    public async Task BroadcastAsync(ChatMessage message)
    {
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            userId = message.UserId,
            message = message.Message,
            sentAtUnixSeconds = message.SentAtUnixSeconds
        });

        await Task.WhenAll(_clients.Select(async pair =>
        {
            var (id, client) = (pair.Key, pair.Value);
            await client.SendLock.WaitAsync();
            try
            {
                if (client.Socket.State == WebSocketState.Open)
                    await client.Socket.SendAsync(payload, WebSocketMessageType.Text, true, CancellationToken.None);
            }
            catch (Exception e)
            {
                logger.LogDebug(e, "Dropping chat client {ClientId}", id);
                _clients.TryRemove(id, out _);
            }
            finally
            {
                client.SendLock.Release();
            }
        }));
    }
}
