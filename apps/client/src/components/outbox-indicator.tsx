import { useState } from "react";
import { CloudIcon, CloudOffIcon, RefreshCwIcon, Trash2Icon, XIcon } from "lucide-react";

import { useOutbox } from "@/hooks/use-outbox";
import { isOnline } from "@/utils/network";

export default function OutboxIndicator() {
  const { stats, queuedItems, clearQueue, forceReplay } = useOutbox();
  const [isExpanded, setIsExpanded] = useState(false);
  const online = isOnline();

  if (stats.queued_count === 0 && online) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end gap-2">
        {isExpanded && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg p-4 w-96 max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-100">Outbox Queue</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-neutral-400 hover:text-neutral-200"
                type="button"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="bg-neutral-700/50 rounded p-2">
                <div className="text-neutral-400">Queued</div>
                <div className="text-lg font-semibold text-neutral-100">{stats.queued_count}</div>
              </div>
              <div className="bg-neutral-700/50 rounded p-2">
                <div className="text-neutral-400">Flushed</div>
                <div className="text-lg font-semibold text-success-500">{stats.flushed_count}</div>
              </div>
              <div className="bg-neutral-700/50 rounded p-2">
                <div className="text-neutral-400">Failed</div>
                <div className="text-lg font-semibold text-error-500">{stats.failed_count}</div>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {queuedItems.map(item => (
                <div key={item.id} className="bg-neutral-700/50 rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-neutral-300">{item.method}</span>
                    <span className="text-neutral-500">
                      {item.attempts}/{item.maxAttempts}
                    </span>
                  </div>
                  <div className="text-neutral-400 truncate">{item.url}</div>
                  {item.lastError && (
                    <div className="text-error-500 text-xs mt-1">{item.lastError}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={forceReplay}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 px-3 py-2 rounded text-xs flex items-center justify-center gap-1"
                type="button"
              >
                <RefreshCwIcon className="w-3 h-3" />
                Retry Now
              </button>
              <button
                onClick={clearQueue}
                className="flex-1 bg-error-600 hover:bg-error-700 text-white px-3 py-2 rounded text-xs flex items-center justify-center gap-1"
                type="button"
              >
                <Trash2Icon className="w-3 h-3" />
                Clear Queue
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            ${!online ? "bg-warning-600" : "bg-info-600"}
            hover:opacity-90 text-white px-4 py-2 rounded-full shadow-lg
            flex items-center gap-2 text-sm font-medium
          `}
          type="button"
        >
          {!online ? (
            <>
              <CloudOffIcon className="w-4 h-4" />
              Offline
            </>
          ) : (
            <>
              <CloudIcon className="w-4 h-4" />
              {stats.queued_count} Queued
            </>
          )}
        </button>
      </div>
    </div>
  );
}
