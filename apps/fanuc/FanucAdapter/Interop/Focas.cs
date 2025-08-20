using System;
using System.Runtime.InteropServices;

namespace FanucAdapter.Interop
{
    [StructLayout(LayoutKind.Sequential, Pack = 2)]
    public struct ODBST
    {
        public short dummy;
        public short tmmode;
        public short aut;
        public short run;
        public short motion;
        public short mstb;
        public short emergency;
        public short alarm;
        public short edit;
    }

    internal static class Focas
    {
        private const string WinLib = "Fwlib32.dll";
        private const string LinLib = "libfwlib32.so";

        [DllImport(WinLib, EntryPoint = "cnc_allclibhndl3", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_allclibhndl3_win(string ip, ushort port, int timeout, out ushort handle);

        [DllImport(LinLib, EntryPoint = "cnc_allclibhndl3", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_allclibhndl3_lin(string ip, ushort port, int timeout, out ushort handle);

        [DllImport(WinLib, EntryPoint = "cnc_freelibhndl", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_freelibhndl_win(ushort handle);

        [DllImport(LinLib, EntryPoint = "cnc_freelibhndl", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_freelibhndl_lin(ushort handle);

        [DllImport(WinLib, EntryPoint = "cnc_statinfo", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_statinfo_win(ushort handle, out ODBST stat);

        [DllImport(LinLib, EntryPoint = "cnc_statinfo", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_statinfo_lin(ushort handle, out ODBST stat);

        public static short cnc_allclibhndl3(string ip, ushort port, int timeout, out ushort handle) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_allclibhndl3_win(ip, port, timeout, out handle)
                : cnc_allclibhndl3_lin(ip, port, timeout, out handle);

        public static short cnc_freelibhndl(ushort handle) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_freelibhndl_win(handle)
                : cnc_freelibhndl_lin(handle);

        public static short cnc_statinfo(ushort handle, out ODBST stat) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_statinfo_win(handle, out stat)
                : cnc_statinfo_lin(handle, out stat);
    }
}
