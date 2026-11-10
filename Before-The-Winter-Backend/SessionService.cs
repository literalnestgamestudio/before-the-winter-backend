namespace Everything_Lost_Backend;

internal enum HeartbeatResult
{
    Ok,
    NotFound,
    ActiveOnAnotherDevice
}

/// <summary>
/// Keeps one active play session per account. A session stays active for <see cref="Lifetime"/> after its last
/// heartbeat. Sessions live in memory, so they are dropped when the backend restarts.
/// </summary>
internal sealed class SessionService(IConfiguration configuration, TimeProvider time)
{
    public const int HeartbeatIntervalSeconds = 30;

    private static readonly TimeSpan Retention = TimeSpan.FromHours(1);

    private readonly object _gate = new();
    private readonly Dictionary<string, Session> _byId = new();
    private readonly Dictionary<string, Session> _currentByUser = new();

    public TimeSpan Lifetime { get; } = TimeSpan.FromSeconds(configuration.GetValue("Sessions:LifetimeSeconds", 90));

    public bool IsActiveOnAnotherDevice(string userId, string deviceId)
    {
        lock (_gate)
        {
            return HeldByAnotherDevice(userId, deviceId, null);
        }
    }

    public bool IsValidSession(string sessionId, string userId)
    {
        lock (_gate)
        {
            return _byId.TryGetValue(sessionId, out var session)
                   && session.UserId == userId
                   && session.ExpiresAt > time.GetUtcNow()
                   && _currentByUser.TryGetValue(userId, out var current)
                   && current == session;
        }
    }

    /// <returns>The new session id, or null if the account is active on another device.</returns>
    public string? TryStart(string userId, string deviceId)
    {
        lock (_gate)
        {
            if (HeldByAnotherDevice(userId, deviceId, null))
            {
                return null;
            }

            RemoveStale();

            var session = new Session(Guid.NewGuid().ToString("N"), userId, deviceId, time.GetUtcNow() + Lifetime);
            _byId[session.Id] = session;
            _currentByUser[userId] = session;
            return session.Id;
        }
    }

    public HeartbeatResult Heartbeat(string sessionId)
    {
        lock (_gate)
        {
            if (!_byId.TryGetValue(sessionId, out var session))
            {
                return HeartbeatResult.NotFound;
            }

            if (HeldByAnotherDevice(session.UserId, session.DeviceId, session))
            {
                return HeartbeatResult.ActiveOnAnotherDevice;
            }

            // Nobody else holds the account, so this session (re)claims it even if it had just lapsed.
            session.ExpiresAt = time.GetUtcNow() + Lifetime;
            _currentByUser[session.UserId] = session;
            return HeartbeatResult.Ok;
        }
    }

    private bool HeldByAnotherDevice(string userId, string deviceId, Session? except)
    {
        return _currentByUser.TryGetValue(userId, out var current)
               && current != except
               && current.DeviceId != deviceId
               && current.ExpiresAt > time.GetUtcNow();
    }

    private void RemoveStale()
    {
        var cutoff = time.GetUtcNow() - Retention;
        foreach (var (id, session) in _byId.Where(pair => pair.Value.ExpiresAt < cutoff).ToList())
        {
            _byId.Remove(id);
            if (_currentByUser.TryGetValue(session.UserId, out var current) && current == session)
            {
                _currentByUser.Remove(session.UserId);
            }
        }
    }

    private sealed class Session(string id, string userId, string deviceId, DateTimeOffset expiresAt)
    {
        public string Id { get; } = id;
        public string UserId { get; } = userId;
        public string DeviceId { get; } = deviceId;
        public DateTimeOffset ExpiresAt { get; set; } = expiresAt;
    }
}
