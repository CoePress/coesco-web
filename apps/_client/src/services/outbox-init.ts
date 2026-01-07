import { __outboxEnabled__ } from "@/config/env";

import { outboxReplayerService } from "./outbox-replayer.service";

export function initOutbox(): void {
  if (!__outboxEnabled__) {
    console.log("[outbox] Feature disabled");
    return;
  }

  console.log("[outbox] Initializing outbox system");
  outboxReplayerService.start();

  window.addEventListener("outbox:flushed", (event: any) => {
    console.log("[outbox] Request flushed:", event.detail);
  });

  window.addEventListener("outbox:failed", (event: any) => {
    console.error("[outbox] Request failed:", event.detail);
  });
}
