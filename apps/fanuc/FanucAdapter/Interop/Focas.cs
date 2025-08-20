using System.Runtime.InteropServices;

namespace FanucAdapter.Interop;

internal static class Focas
{
    private const string WinLib = "Fwlib32.dll";      // dev on Windows
    private const string LinLib = "libfwlib32.so";    // symlinked GitHub .so

    [DllImport(WinLib, EntryPoint="cnc_allclibhndl3", CallingConvention=CallingConvention.Cdecl)]
    private static extern short cnc_allclibhndl3_win(string ip, ushort port, int timeout, out ushort handle);

    [DllImport(LinLib, EntryPoint="cnc_allclibhndl3", CallingConvention=CallingConvention.Cdecl)]
    private static extern short cnc_allclibhndl3_lin(string ip, ushort port, int timeout, out ushort handle);

    public static short cnc_allclibhndl3(string ip, ushort port, int timeout, out ushort handle)
        => RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? cnc_allclibhndl3_win(ip, port, timeout, out handle)
            : cnc_allclibhndl3_lin(ip, port, timeout, out handle);
}
