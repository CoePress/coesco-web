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
            m.ProgramName, m.SpindleSpeed,
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
            Console.WriteLine($"[DEBUG] Loop iteration starting at {DateTime.UtcNow}");
            foreach (var m in _machines.Values)
            {
                Console.WriteLine($"[DEBUG] Checking machine {m.Slug}: Handle={m.Handle}, Connection={m.Connection}");
                
                // Auto-connect if not connected
                if (m.Handle == null)
                {
                    Console.WriteLine($"[DEBUG] Machine {m.Slug} not connected, attempting connection to {m.Ip}:{m.Port}");
                    var rc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var handle);
                    if (rc == 0)
                    {
                        m.Handle = handle;
                        m.Connection = "CONNECTED";
                        m.ConsecutiveFailures = 0;
                        m.LastSeen = DateTime.UtcNow;
                        Console.WriteLine($"[DEBUG] {m.Slug} connected successfully with handle={handle}");
                    }
                    else
                    {
                        Console.WriteLine($"[ERROR] {m.Slug} connection failed with error code {rc}");
                        m.Connection = "DISCONNECTED";
                        m.ConsecutiveFailures++;
                        continue;
                    }
                }
                
                if (m.Handle is ushort h)
                {
                    Console.WriteLine($"[DEBUG] ========== POLLING {m.Slug} with handle {h} ==========");
                    
                    var stat = new ODBST();
                    Console.WriteLine($"[DEBUG] Calling cnc_statinfo with handle {h}");
                    var rc = Focas.cnc_statinfo(h, stat);
                    Console.WriteLine($"[DEBUG] cnc_statinfo returned rc={rc} for {m.Slug}");
                    Console.WriteLine($"[DEBUG] ODBST values after call:");
                    Console.WriteLine($"  dummy={stat.dummy}, tmmode={stat.tmmode}, aut={stat.aut}");
                    Console.WriteLine($"  run={stat.run}, motion={stat.motion}, mstb={stat.mstb}");
                    Console.WriteLine($"  emergency={stat.emergency}, alarm={stat.alarm}, edit={stat.edit}");

                    if (rc == 0)
                    {
                        Console.WriteLine($"[DEBUG] cnc_statinfo SUCCESS! Processing data...");
                        m.Connection = "CONNECTED";
                        m.Status = StatusNumberToString(stat.run);
                        m.Mode   = ModeNumberToString(stat.aut);
                        Console.WriteLine($"[DEBUG] Status={m.Status} (from run={stat.run}), Mode={m.Mode} (from aut={stat.aut})");
                        m.LastSeen = DateTime.UtcNow;
                        
                        // Get spindle speed
                        Console.WriteLine($"[DEBUG] Calling cnc_acts with handle {h}");
                        var spindleRc = Focas.cnc_acts(h, out var act);
                        Console.WriteLine($"[DEBUG] cnc_acts returned rc={spindleRc}");
                        if (spindleRc == 0)
                        {
                            m.SpindleSpeed = act.data;
                            Console.WriteLine($"[DEBUG] Spindle speed SUCCESS: {act.data} RPM");
                            if (act.dummy != null)
                                Console.WriteLine($"[DEBUG] ODBACT dummy values: [{string.Join(", ", act.dummy)}]");
                        }
                        else
                        {
                            Console.WriteLine($"[ERROR] cnc_acts FAILED rc={spindleRc} for {m.Slug}");
                        }
                        
                        // Get program name - try cnc_rdprgnum first
                        Console.WriteLine($"[DEBUG] Calling cnc_rdprgnum with handle {h}");
                        var prgNumRc = Focas.cnc_rdprgnum(h, out var prgNum);
                        Console.WriteLine($"[DEBUG] cnc_rdprgnum returned rc={prgNumRc}");
                        if (prgNumRc == 0)
                        {
                            m.ProgramName = $"O{prgNum.data}";
                            Console.WriteLine($"[DEBUG] Program number SUCCESS: O{prgNum.data} (mdata={prgNum.mdata})");
                        }
                        else
                        {
                            Console.WriteLine($"[ERROR] cnc_rdprgnum FAILED rc={prgNumRc}, trying cnc_exeprgname");
                            var progRc = Focas.cnc_exeprgname(h, out var prg);
                            Console.WriteLine($"[DEBUG] cnc_exeprgname returned rc={progRc}");
                            if (progRc == 0)
                            {
                                m.ProgramName = prg.name ?? "UNKNOWN";
                                Console.WriteLine($"[DEBUG] Program name SUCCESS: '{prg.name}', o_num={prg.o_num}");
                            }
                            else
                            {
                                Console.WriteLine($"[ERROR] cnc_exeprgname also FAILED rc={progRc}");
                                m.ProgramName = "UNKNOWN";
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[ERROR] cnc_statinfo FAILED rc={rc} for {m.Slug}");
                        Console.WriteLine($"[ERROR] Error code {rc} typically means: {GetErrorDescription(rc)}");
                        Focas.cnc_freelibhndl(h);
                        m.Handle = null;
                        m.Connection = "DISCONNECTED";
                        m.Status = "UNKNOWN";
                        m.Mode = "UNKNOWN";
                        m.ProgramName = "UNKNOWN";
                        m.SpindleSpeed = 0;
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
        public string ProgramName { get; set; } = "UNKNOWN";
        public int SpindleSpeed { get; set; } = 0;
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
    
    private static string GetErrorDescription(short errorCode) => errorCode switch
    {
        0 => "OK",
        1 => "EW_FUNC - Function not supported or invalid state",
        2 => "EW_HANDLE - Invalid handle",
        3 => "EW_DATA - Invalid data",
        4 => "EW_PARAM - Invalid parameter",
        5 => "EW_OPTION - Invalid option",
        6 => "EW_PROT - Write protected",
        7 => "EW_MMCSYS - MMC system error",
        8 => "EW_SYSTEM - System error",
        -8 => "EW_NOOPT - No option/function not available on this CNC",
        9 => "EW_BUSY - Device busy",
        10 => "EW_TIME - Timeout",
        -16 => "EW_SOCKET - Socket error",
        _ => $"Unknown error code: {errorCode}",
    };
}
