import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Buffer } from "node:buffer";

import type { PresignedUrlOptions, PresignedUrlResult, StorageMetadata, StorageService, UploadOptions, UploadResult } from "./types";

export interface R2StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

export class R2StorageService implements StorageService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl?: string;

  constructor(config: R2StorageConfig) {
    this.bucketName = config.bucketName;
    this.publicUrl = config.publicUrl;

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
      CacheControl: options?.cacheControl || "public, max-age=31536000",
    });

    const response = await this.client.send(command);

    return {
      key,
      url: this.getPublicUrl(key),
      cdnUrl: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
      size: buffer.length,
      contentType: options?.contentType || "application/octet-stream",
      etag: response.ETag,
    };
  }

  async download(key: string): Promise<{ buffer: Buffer; metadata: StorageMetadata }> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    const buffer = Buffer.from(await response.Body.transformToByteArray());

    return {
      buffer,
      metadata: {
        contentType: response.ContentType,
        size: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
      },
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.getMetadata(key);
      return true;
    }
    catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);

    return {
      contentType: response.ContentType,
      size: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  }

  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  async generatePresignedUploadUrl(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    const expiresIn = options?.expiresIn || 3600;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: options?.contentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      key,
    };
  }

  async generatePresignedDownloadUrl(
    key: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    const expiresIn = options?.expiresIn || 3600;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ResponseContentDisposition: options?.contentDisposition,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      key,
    };
  }

  async listFiles(prefix?: string, maxKeys = 1000): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.client.send(command);

    return response.Contents?.map(obj => obj.Key!).filter(Boolean) || [];
  }
}
