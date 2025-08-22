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
        // Initial connection to all machines
        foreach (var m in _machines.Values)
        {
            Console.WriteLine($"[STARTUP] Connecting to {m.Slug} at {m.Ip}:{m.Port}");
            var rc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var handle);
            if (rc == 0)
            {
                m.Handle = handle;
                m.Connection = "CONNECTED";
                m.LastSeen = DateTime.UtcNow;
                m.HandleCreatedAt = DateTime.UtcNow;
                Console.WriteLine($"[STARTUP] {m.Slug} connected with handle={handle}");
            }
            else
            {
                Console.WriteLine($"[STARTUP] {m.Slug} connection failed: {rc}");
                m.Connection = "DISCONNECTED";
            }
        }
        
        while (!ct.IsCancellationRequested)
        {
            foreach (var m in _machines.Values)
            {
                if (m.Handle is ushort h)
                {
                    try
                    {
                        // Refresh handle every 30 seconds to prevent stale connections
                        if ((DateTime.UtcNow - m.HandleCreatedAt).TotalSeconds > 30)
                        {
                            Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [INFO] Refreshing handle for {m.Slug} (handle age: {(DateTime.UtcNow - m.HandleCreatedAt).TotalSeconds:F0}s)");
                            Focas.cnc_freelibhndl(h);
                            
                            var refreshRc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var newHandle);
                            if (refreshRc == 0)
                            {
                                m.Handle = newHandle;
                                m.HandleCreatedAt = DateTime.UtcNow;
                                h = newHandle;
                                Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [INFO] Handle refreshed: {newHandle}");
                            }
                        }
                        
                        // Simple read - just get the data without reconnecting
                        var stat = new ODBST();
                        var rc = Focas.cnc_statinfo(h, stat);
                        
                        if (rc == 0)
                        {
                            // Success - update data
                            m.Connection = "CONNECTED";
                            m.Status = StatusNumberToString(stat.run);
                            m.Mode = ModeNumberToString(stat.aut);
                            var previousLastSeen = m.LastSeen;
                            m.LastSeen = DateTime.UtcNow;
                            m.ConsecutiveFailures = 0;
                            
                            // Log successful reads periodically
                            if ((DateTime.UtcNow - previousLastSeen).TotalSeconds > 5)
                            {
                                Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [OK] Reading successfully from {m.Slug} - Status={m.Status}, Mode={m.Mode}");
                            }
                            
                            // Get spindle speed
                            var spindleRc = Focas.cnc_acts(h, out var act);
                            if (spindleRc == 0)
                                m.SpindleSpeed = act.data;
                            
                            // Get program number
                            var prgNumRc = Focas.cnc_rdprgnum(h, out var prgNum);
                            if (prgNumRc == 0)
                                m.ProgramName = $"O{prgNum.data}";
                        }
                        else if (rc == -8 || rc == -16)
                        {
                            m.ConsecutiveFailures++;
                            
                            // Only reconnect after multiple failures or timeout
                            if (m.ConsecutiveFailures >= 3 || (DateTime.Now - m.LastSeen).TotalSeconds > 10)
                            {
                                // Connection lost - try to reconnect
                                var now = DateTime.Now;
                                Console.WriteLine($"[{now:HH:mm:ss.fff}] [WARN] Lost connection to {m.Slug} (rc={rc}, failures={m.ConsecutiveFailures}), reconnecting...");
                                Console.WriteLine($"  Last successful read was {(now - m.LastSeen).TotalSeconds:F1} seconds ago");
                                Focas.cnc_freelibhndl(h);
                                m.Handle = null;
                                
                                // Wait a bit before reconnecting
                                await Task.Delay(500);
                                
                                var reconnectRc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var newHandle);
                                if (reconnectRc == 0)
                                {
                                    m.Handle = newHandle;
                                    m.HandleCreatedAt = DateTime.UtcNow;
                                    m.Connection = "CONNECTED";
                                    m.ConsecutiveFailures = 0;
                                    Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [INFO] Reconnected to {m.Slug} with handle={newHandle}");
                                    
                                    // Try to read immediately with new handle to verify it works
                                    var testStat = new ODBST();
                                    var testRc = Focas.cnc_statinfo(newHandle, testStat);
                                    Console.WriteLine($"  Test read with new handle: rc={testRc}");
                                    
                                    if (testRc == 0)
                                    {
                                        // Update data from test read
                                        m.Status = StatusNumberToString(testStat.run);
                                        m.Mode = ModeNumberToString(testStat.aut);
                                        m.LastSeen = DateTime.UtcNow;
                                        Console.WriteLine($"  Test read data: Status={m.Status}, Mode={m.Mode}");
                                    }
                                }
                                else
                                {
                                    m.Connection = "DISCONNECTED";
                                }
                            }
                            else
                            {
                                // Just log the error but keep trying with same handle
                                Console.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] [WARN] Read failed for {m.Slug} (rc={rc}), attempt {m.ConsecutiveFailures}/3");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[ERROR] Exception polling {m.Slug}: {ex.Message}");
                        m.Connection = "ERROR";
                    }
                }
                else
                {
                    // Not connected - try to connect
                    if (m.ConsecutiveFailures < 10) // Don't spam connection attempts
                    {
                        var rc = Focas.cnc_allclibhndl3(m.Ip, m.Port, 10, out var handle);
                        if (rc == 0)
                        {
                            m.Handle = handle;
                            m.Connection = "CONNECTED";
                            m.ConsecutiveFailures = 0;
                            Console.WriteLine($"[INFO] Connected to {m.Slug} with handle={handle}");
                        }
                        else
                        {
                            m.ConsecutiveFailures++;
                        }
                    }
                }
            }
            // Try polling every 2 seconds instead of 1
            await Task.Delay(TimeSpan.FromSeconds(2), ct);
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
        public DateTime HandleCreatedAt { get; set; }
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
