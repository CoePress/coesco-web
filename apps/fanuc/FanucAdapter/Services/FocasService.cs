using System;
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
            m.Connection, m.Status, m.Mode,
            m.Handle, m.LastSeen, m.ConsecutiveFailures
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
            m.Connection = "CONNECTED";
            m.ConsecutiveFailures = 0;
            m.LastSeen = DateTime.UtcNow;
            return $"{slug} connected (handle={handle})";
        }
        else
        {
            m.Connection = "DISCONNECTED";
            m.ConsecutiveFailures++;
            return $"{slug} connect error {rc}";
        }
    }

    public string Connect(string ip, ushort port, string slug) => Connect(slug);

    public string Disconnect(string slug)
    {
        if (!_machines.TryGetValue(slug, out var m))
            return $"Unknown machine {slug}";

        if (m.Handle is ushort h)
        {
            Focas.cnc_freelibhndl(h);
            m.Handle = null;
            m.Connection = "DISCONNECTED";
            m.Status = "UNKNOWN";
            m.Mode = "UNKNOWN";
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
                if (m.Handle is ushort h)
                {
                    var rc = Focas.cnc_statinfo(h, out var stat);
                    Console.WriteLine($"[DEBUG] cnc_statinfo rc={rc} for {m.Slug}");

                    if (rc == 0)
                    {
                        Console.WriteLine($"[DEBUG] raw stat: aut={stat.aut}, run={stat.run}, tmmode={stat.tmmode}");
                        m.Connection = "CONNECTED";
                        m.Status = StatusNumberToString(stat.run);
                        m.Mode   = ModeNumberToString(stat.aut);
                        m.LastSeen = DateTime.UtcNow;
                    }
                    else
                    {
                        Console.WriteLine($"[ERROR] cnc_statinfo FAILED rc={rc} for {m.Slug}");
                        Focas.cnc_freelibhndl(h);
                        m.Handle = null;
                        m.Connection = "DISCONNECTED";
                        m.Status = "UNKNOWN";
                        m.Mode = "UNKNOWN";
                        m.ConsecutiveFailures++;
                    }
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
        public string Connection { get; set; } = "INIT";
        public string Mode { get; set; } = "UNKNOWN";
        public string Status { get; set; } = "UNKNOWN";
        public DateTime LastSeen { get; set; }
        public int ConsecutiveFailures { get; set; }

        public MachineState(string slug, string ip, ushort port)
        {
            Slug = slug; Ip = ip; Port = port;
        }
    }

    private static string ModeNumberToString(int num) => num switch
    {
        0 => "MDI",
        1 => "MEM",
        2 => "****",
        3 => "EDIT",
        4 => "HND",
        5 => "JOG",
        6 => "T-JOG",
        7 => "T-HND",
        8 => "INC",
        9 => "REF",
        10 => "RMT",
        _ => "UNAVAILABLE",
    };

    private static string StatusNumberToString(int num) => num switch
    {
        0 => "****",
        1 => "STOP",
        2 => "HOLD",
        3 => "STRT",
        4 => "MSTR",
        _ => "UNAVAILABLE",
    };
}
