import type { Buffer } from "node:buffer";

export interface StorageMetadata {
  contentType?: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
  [key: string]: unknown;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
  cacheControl?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  contentType: string;
  etag?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number;
  contentType?: string;
  contentDisposition?: string;
}

export interface PresignedUrlResult {
  url: string;
  expiresAt: Date;
  key: string;
}

export interface StorageService {
  upload: (
    key: string,
    buffer: Buffer,
    options?: UploadOptions
  ) => Promise<UploadResult>;

  download: (key: string) => Promise<{ buffer: Buffer; metadata: StorageMetadata }>;

  delete: (key: string) => Promise<void>;

  exists: (key: string) => Promise<boolean>;

  getMetadata: (key: string) => Promise<StorageMetadata>;

  getPublicUrl: (key: string) => string;

  generatePresignedUploadUrl: (
    key: string,
    options?: PresignedUrlOptions
  ) => Promise<PresignedUrlResult>;

  generatePresignedDownloadUrl: (
    key: string,
    options?: PresignedUrlOptions
  ) => Promise<PresignedUrlResult>;

  listFiles: (prefix?: string, maxKeys?: number) => Promise<string[]>;
}

export type StorageProvider = "r2" | "local";

export interface StorageConfig {
  provider: StorageProvider;
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl?: string;
  };
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
}
