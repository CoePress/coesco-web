using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using FanucAdapter.Interop;

namespace FanucAdapter.Services;

public class FocasService
{
    private readonly ConcurrentDictionary<string, MachineState> _machines = new();
    private readonly CancellationTokenSource _cts = new();

    public FocasService(IEnumerable<(string Slug, string Ip, ushort Port)> configs)
    {
        foreach (var cfg in configs)
            _machines[cfg.Slug] = new MachineState(cfg.Slug, cfg.Ip, cfg.Port);

        Task.Run(() => Loop(_cts.Token));
    }

    public object Status()
    {
        return _machines.Values.Select(m => new {
            m.Slug, m.Ip, m.Port,
            m.Status, m.Handle, m.LastSeen, m.ConsecutiveFailures
        }).ToList();
    }

    public string Connect(string slug)
    {
        if (!_machines.TryGetValue(slug, out var m))
            return $"Unknown machine {slug}";

        if (m.Handle != null)
            return $"{slug} already connected (handle={m.Handle})";

        var rc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var handle);
        if (rc == 0)
        {
            m.Handle = handle;
            m.Status = "CONNECTED";
            m.ConsecutiveFailures = 0;
            m.LastSeen = DateTime.UtcNow;
            return $"{slug} connected (handle={handle})";
        }
        else
        {
            m.Status = "DISCONNECTED";
            m.ConsecutiveFailures++;
            return $"{slug} connect error {rc}";
        }
    }

    public string Connect(string ip, ushort port, string slug)
    {
        // shim for compatibility: slug drives everything
        return Connect(slug);
    }

    public string Disconnect(string slug)
    {
        if (!_machines.TryGetValue(slug, out var m))
            return $"Unknown machine {slug}";

        if (m.Handle is ushort h)
        {
            Focas.cnc_freelibhndl(h);
            m.Handle = null;
            m.Status = "DISCONNECTED";
            m.LastSeen = DateTime.UtcNow;
            return $"{slug} disconnected";
        }
        return $"{slug} not connected";
    }

    private async Task Loop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            foreach (var m in _machines.Values)
            {
                if (m.Handle is null)
                {
                    // try connect
                    var rc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var handle);
                    if (rc == 0)
                    {
                        m.Handle = handle;
                        m.Status = "CONNECTED";
                        m.ConsecutiveFailures = 0;
                        m.LastSeen = DateTime.UtcNow;
                    }
                    else
                    {
                        m.Status = "DISCONNECTED";
                        m.ConsecutiveFailures++;
                    }
                }
                else
                {
                    // TODO: add cheap health check call here
                    m.LastSeen = DateTime.UtcNow;
                }
            }
            await Task.Delay(TimeSpan.FromSeconds(30), ct);
        }
    }

    private sealed class MachineState
    {
        public string Slug { get; }
        public string Ip { get; }
        public ushort Port { get; }
        public ushort? Handle { get; set; }
        public string Status { get; set; } = "INIT";
        public DateTime LastSeen { get; set; }
        public int ConsecutiveFailures { get; set; }

        public MachineState(string slug, string ip, ushort port)
        {
            Slug = slug; Ip = ip; Port = port;
        }
    }
}
