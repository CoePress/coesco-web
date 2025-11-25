import { useState, useEffect } from "react";

import { Button } from "@/components";
import { useApi } from "@/hooks/use-api";

export function TeamsConnectionButton() {
  const api = useApi();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "teams-connected") {
        setIsConnected(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const checkConnection = async () => {
    try {
      const result = await api.get("/system/teams/connection-status");
      setIsConnected(result?.data?.isConnected || false);
    } catch (error) {
      console.error("Failed to check Teams connection status:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    const result = await api.get("/system/teams/auth");
    if (result?.data?.authUrl) {
      window.open(result.data.authUrl, "_blank", "width=600,height=800");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect from Teams?")) return;
    await api.delete("/system/teams/connection");
    setIsConnected(false);
  };

  if (isLoading) {
    return <div className="text-sm text-text-muted">Loading...</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <span className="text-sm text-success">✓ Teams Connected</span>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </>
      ) : (
        <>
          <span className="text-sm text-text-muted">Teams not connected</span>
          <Button variant="primary" size="sm" onClick={handleConnect}>
            Connect Teams
          </Button>
        </>
      )}
    </div>
  );
}
