import { useEffect, useState } from "react";

import type { OutboxRecord, OutboxStats } from "@/types/outbox.types";

import { outboxReplayerService } from "@/services/outbox-replayer.service";
import { outboxService } from "@/services/outbox.service";

export function useOutbox() {
  const [stats, setStats] = useState<OutboxStats>({
    queued_count: 0,
    flushed_count: 0,
    failed_count: 0,
  });
  const [queuedItems, setQueuedItems] = useState<OutboxRecord[]>([]);

  const refreshStats = async () => {
    try {
      const count = await outboxService.count();
      setStats(prev => ({
        ...prev,
        queued_count: count,
      }));
    }
    catch (error) {
      console.error("[outbox] Error refreshing stats:", error);
    }
  };

  const refreshQueue = async () => {
    try {
      const items = await outboxService.getAll();
      setQueuedItems(items);
    }
    catch (error) {
      console.error("[outbox] Error refreshing queue:", error);
    }
  };

  const clearQueue = async () => {
    try {
      await outboxService.clear();
      await refreshStats();
      await refreshQueue();
    }
    catch (error) {
      console.error("[outbox] Error clearing queue:", error);
    }
  };

  const forceReplay = async () => {
    try {
      await outboxReplayerService.processQueue();
      await refreshStats();
      await refreshQueue();
    }
    catch (error) {
      console.error("[outbox] Error forcing replay:", error);
    }
  };

  useEffect(() => {
    const handleFlushed = () => {
      setStats(prev => ({
        ...prev,
        flushed_count: prev.flushed_count + 1,
      }));
      refreshStats();
      refreshQueue();
    };

    const handleFailed = () => {
      setStats(prev => ({
        ...prev,
        failed_count: prev.failed_count + 1,
      }));
      refreshStats();
      refreshQueue();
    };

    window.addEventListener("outbox:flushed", handleFlushed);
    window.addEventListener("outbox:failed", handleFailed);

    refreshStats();
    refreshQueue();

    return () => {
      window.removeEventListener("outbox:flushed", handleFlushed);
      window.removeEventListener("outbox:failed", handleFailed);
    };
  }, []);

  return {
    stats,
    queuedItems,
    refreshStats,
    refreshQueue,
    clearQueue,
    forceReplay,
  };
}
