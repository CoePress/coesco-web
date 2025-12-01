import { useEffect, useState } from "react";

import { useSocket } from "@/contexts/socket.context";

interface NetworkInfo {
  onLine: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

function SyncTest() {
  const { isSystemConnected, subscribeToSystemStatus, unsubscribeFromSystemStatus } = useSocket();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    onLine: navigator.onLine,
  });

  const updateNetworkInfo = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    setNetworkInfo({
      onLine: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      type: connection?.type,
    });
  };

  useEffect(() => {
    subscribeToSystemStatus();
    updateNetworkInfo();

    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener("change", updateNetworkInfo);
    }

    const retryInterval = setInterval(() => {
      if (!isSystemConnected) {
        subscribeToSystemStatus();
      }
    }, 3000);

    return () => {
      clearInterval(retryInterval);
      unsubscribeFromSystemStatus();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", updateNetworkInfo);
      }
    };
  }, [isSystemConnected]);

  return (
    <div className="p-8 space-y-6 text-text">
      <h1 className="text-2xl mb-4 text-text">Socket Connection Test</h1>

      <div className="space-y-4">
        <div className="text-lg text-text">
          Socket Status:
          {" "}
          <span className={isSystemConnected ? "text-success" : "text-error"}>
            {isSystemConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="bg-surface p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-text">Network Information</h2>
          <div className="space-y-2 text-sm text-text">
            <div className="text-text">
              Browser Online:
              {" "}
              <span className={networkInfo.onLine ? "text-success" : "text-error"}>
                {networkInfo.onLine ? "Yes" : "No"}
              </span>
            </div>

            {networkInfo.effectiveType && (
              <div className="text-text">
                Connection Type:
                <span className="font-mono text-text">{networkInfo.effectiveType}</span>
              </div>
            )}

            {networkInfo.downlink !== undefined && (
              <div className="text-text">
                Downlink Speed:
                <span className="font-mono text-text">
                  {networkInfo.downlink}
                  {" "}
                  Mbps
                </span>
              </div>
            )}

            {networkInfo.rtt !== undefined && (
              <div className="text-text">
                Round Trip Time:
                <span className="font-mono text-text">
                  {networkInfo.rtt}
                  {" "}
                  ms
                </span>
              </div>
            )}

            {networkInfo.type && (
              <div className="text-text">
                Network Type:
                <span className="font-mono text-text">{networkInfo.type}</span>
              </div>
            )}

            {networkInfo.saveData !== undefined && (
              <div className="text-text">
                Data Saver:
                <span className="font-mono text-text">{networkInfo.saveData ? "Enabled" : "Disabled"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-text">User Agent</h2>
          <div className="text-sm font-mono break-all text-text">{navigator.userAgent}</div>
        </div>
      </div>
    </div>
  );
}

export default SyncTest;
