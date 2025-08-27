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
            m.LastSeen, m.ConsecutiveFailures
        }).ToList();
    }
    
    public MachineData GetMachineData(string slug)
    {
        if (!_machines.TryGetValue(slug, out var m))
            return null;
            
        return new MachineData
        {
            MachineName = m.Slug,
            Uuid = m.Uuid,
            ConnectionStatus = m.Connection,
            ExecutionStatus = m.Status,
            ControllerMode = m.Mode,
            ProgramName = m.ProgramName,
            EmergencyStop = m.Emergency == 0 ? "ARMED" : "TRIGGERED",
            SpindleSpeed = m.SpindleSpeed,
            SpindleLoad = m.SpindleLoad,
            SpindleOverride = m.SpindleOverride,
            FeedRate = m.FeedRate,
            FeedOverride = m.FeedOverride,
            PartCount = m.PartCount,
            LineNumber = m.LineNumber,
            XPosition = m.XPosition != null ? new AxisData { Actual = m.XPosition.Value } : null,
            YPosition = m.YPosition != null ? new AxisData { Actual = m.YPosition.Value } : null,
            ZPosition = m.ZPosition != null ? new AxisData { Actual = m.ZPosition.Value } : null,
            XLoad = m.XLoad,
            YLoad = m.YLoad,
            ZLoad = m.ZLoad,
            XFeedRate = m.XFeedRate,
            YFeedRate = m.YFeedRate,
            ZFeedRate = m.ZFeedRate
        };
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
        Console.WriteLine("[STARTUP] Using connect-read-disconnect strategy");
        
        while (!ct.IsCancellationRequested)
        {
            foreach (var m in _machines.Values)
            {
                try
                {
                    // Connect fresh every time
                    var rc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var handle);
                    if (rc == 0)
                    {
                        // Read all data quickly
                        var stat = new ODBST();
                        var statRc = Focas.cnc_statinfo(handle, stat);
                        
                        if (statRc == 0)
                        {
                            m.Connection = "CONNECTED";
                            m.Status = StatusNumberToString(stat.run);
                            m.Mode = ModeNumberToString(stat.aut);
                            m.Emergency = stat.emergency;
                            var previousLastSeen = m.LastSeen;
                            m.LastSeen = DateTime.UtcNow;
                            
                            // Reset failures on success
                            if (m.ConsecutiveFailures > 0)
                            {
                                Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [INFO] {m.Slug} recovered after {m.ConsecutiveFailures} failures");
                            }
                            m.ConsecutiveFailures = 0;
                            
                            // Log periodically to confirm it's working
                            if ((DateTime.UtcNow - previousLastSeen).TotalSeconds > 30)
                            {
                                Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [OK] {m.Slug} - Status={m.Status}, Mode={m.Mode}, Program={m.ProgramName}");
                            }
                            
                            // Get spindle speed
                            var spindleRc = Focas.cnc_acts(handle, out var act);
                            if (spindleRc == 0)
                                m.SpindleSpeed = act.data;
                            
                            // Get program number
                            var prgNumRc = Focas.cnc_rdprgnum(handle, out var prgNum);
                            if (prgNumRc == 0)
                                m.ProgramName = $"O{prgNum.data}";
                        }
                        else
                        {
                            Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [ERROR] Read failed for {m.Slug}: rc={statRc}");
                            m.Connection = "READ_ERROR";
                            m.ConsecutiveFailures++;
                        }
                        
                        // ALWAYS disconnect immediately
                        Focas.cnc_freelibhndl(handle);
                    }
                    else
                    {
                        // Log first failure and then every 10th
                        if (m.ConsecutiveFailures == 0 || m.ConsecutiveFailures % 10 == 0)
                            Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [ERROR] Connect failed for {m.Slug}: rc={rc} ({GetErrorDescription((short)rc)})");
                        m.Connection = "DISCONNECTED";
                        m.ConsecutiveFailures++;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Exception polling {m.Slug}: {ex.Message}");
                    m.Connection = "ERROR";
                }
            }
            
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }
    }

    private sealed class MachineState
    {
        public string Slug { get; }
        public string Ip { get; }
        public ushort Port { get; }
        public string Uuid { get; }
        public ushort? Handle { get; set; }
        public string Connection { get; set; } = "INIT";
        public string Mode { get; set; } = "UNKNOWN";
        public string Status { get; set; } = "UNKNOWN";
        public string ProgramName { get; set; } = "UNKNOWN";
        public int SpindleSpeed { get; set; } = 0;
        public double? SpindleLoad { get; set; }
        public int? SpindleOverride { get; set; }
        public double? FeedRate { get; set; }
        public int? FeedOverride { get; set; }
        public int? PartCount { get; set; }
        public int? LineNumber { get; set; }
        public int Emergency { get; set; } = 0;
        public double? XPosition { get; set; }
        public double? YPosition { get; set; }
        public double? ZPosition { get; set; }
        public double? XLoad { get; set; }
        public double? YLoad { get; set; }
        public double? ZLoad { get; set; }
        public double? XFeedRate { get; set; }
        public double? YFeedRate { get; set; }
        public double? ZFeedRate { get; set; }
        public DateTime LastSeen { get; set; }
        public DateTime HandleCreatedAt { get; set; }
        public int ConsecutiveFailures { get; set; }

        public MachineState(string slug, string ip, ushort port)
        {
            Slug = slug; 
            Ip = ip; 
            Port = port;
            Uuid = Guid.NewGuid().ToString();
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
