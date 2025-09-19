import { localDatabase } from "./database";

export class SubmissionService {
  async submit(payload: any) {
    const submission = {
      id: crypto.randomUUID(),
      payload,
      createdAt: new Date(),
    };

    await localDatabase.put("submissions", submission);

    const reg: any = await navigator.serviceWorker.ready;
    if ("sync" in reg) {
      await reg.sync.register("sync-submissions");
    }
    else {
      window.addEventListener("online", () => {
        reg.active?.postMessage({ type: "FLUSH_SUBMISSIONS" });
      });
    }
  }
}

export const submissionService = new SubmissionService();
