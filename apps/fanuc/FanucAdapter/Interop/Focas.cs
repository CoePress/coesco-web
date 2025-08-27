using System;
using System.Runtime.InteropServices;

namespace FanucAdapter.Interop
{
    [StructLayout(LayoutKind.Sequential, Pack = 2)]
    public class ODBST
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

    [StructLayout(LayoutKind.Sequential, Pack = 2)]
    public struct ODBACT
    {
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 2)]
        public short[] dummy;
        public int data;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi, Pack = 2)]
    public struct ODBEXEPRG  
    {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 36)]
        public string name;
        public int o_num;
    }
    
    [StructLayout(LayoutKind.Sequential, Pack = 2)]
    public struct ODBPRO
    {
        public short dummy1;
        public short dummy2;
        public int data;
        public int mdata;
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
        private static extern short cnc_statinfo_win(ushort handle, [In, Out] ODBST stat);

        [DllImport(LinLib, EntryPoint = "cnc_statinfo", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_statinfo_lin(ushort handle, [In, Out] ODBST stat);

        [DllImport(WinLib, EntryPoint = "cnc_acts", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_acts_win(ushort handle, out ODBACT act);

        [DllImport(LinLib, EntryPoint = "cnc_acts", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_acts_lin(ushort handle, out ODBACT act);

        [DllImport(WinLib, EntryPoint = "cnc_exeprgname", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_exeprgname_win(ushort handle, out ODBEXEPRG prg);

        [DllImport(LinLib, EntryPoint = "cnc_exeprgname", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_exeprgname_lin(ushort handle, out ODBEXEPRG prg);
        
        [DllImport(WinLib, EntryPoint = "cnc_rdprgnum", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_rdprgnum_win(ushort handle, out ODBPRO prg);

        [DllImport(LinLib, EntryPoint = "cnc_rdprgnum", CallingConvention = CallingConvention.Cdecl)]
        private static extern short cnc_rdprgnum_lin(ushort handle, out ODBPRO prg);


        public static short cnc_allclibhndl3(string ip, ushort port, int timeout, out ushort handle) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_allclibhndl3_win(ip, port, timeout, out handle)
                : cnc_allclibhndl3_lin(ip, port, timeout, out handle);

        public static short cnc_freelibhndl(ushort handle) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_freelibhndl_win(handle)
                : cnc_freelibhndl_lin(handle);

        public static short cnc_statinfo(ushort handle, ODBST stat) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_statinfo_win(handle, stat)
                : cnc_statinfo_lin(handle, stat);

        public static short cnc_acts(ushort handle, out ODBACT act) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_acts_win(handle, out act)
                : cnc_acts_lin(handle, out act);

        public static short cnc_exeprgname(ushort handle, out ODBEXEPRG prg) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_exeprgname_win(handle, out prg)
                : cnc_exeprgname_lin(handle, out prg);
                
        public static short cnc_rdprgnum(ushort handle, out ODBPRO prg) =>
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? cnc_rdprgnum_win(handle, out prg)
                : cnc_rdprgnum_lin(handle, out prg);
    }
}
