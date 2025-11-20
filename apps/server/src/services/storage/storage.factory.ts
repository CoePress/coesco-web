/* eslint-disable node/no-process-env */
/* eslint-disable node/prefer-global/process */
import path from "node:path";

import type { StorageConfig, StorageService } from "./types";

import { LocalStorageService } from "./local-storage.service";
import { R2StorageService } from "./r2-storage.service";

export function createStorageService(config?: StorageConfig): StorageService {
  const provider = config?.provider || (process.env.STORAGE_PROVIDER as "r2" | "local") || "local";

  if (provider === "r2") {
    const r2Config = config?.r2 || {
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME!,
      publicUrl: process.env.R2_PUBLIC_URL,
    };

    if (!r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucketName) {
      throw new Error("R2 configuration is incomplete. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.");
    }

    return new R2StorageService(r2Config);
  }

  const localConfig = config?.local || {
    uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
    baseUrl: process.env.UPLOAD_BASE_URL || "/uploads",
  };

  return new LocalStorageService(localConfig);
}

export const storageService = createStorageService();
