using FanucAdapter.Interop;

namespace FanucAdapter.Services;

public class FocasService
{
    public string Connect(string ip, ushort port)
    {
        var rc = Focas.cnc_allclibhndl3(ip, port, 10, out var handle);

        return rc == 0
            ? $"Connected (handle={handle})"
            : $"Error {rc}";
    }
}
