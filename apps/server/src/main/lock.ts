import { cacheService } from "@/services";

export interface DocumentLock {
  userId: string;
  model: string;
  recordId: string;
  timestamp: number;
}

export class LockService {
  private readonly TTL = 300;
  private getKey(model: string, id: string) {
    return `lock:${model}:${id}`;
  }

  async lock(model: string, id: string, userId: string): Promise<boolean> {
    const key = this.getKey(model, id);
    const existing = await cacheService.get<DocumentLock>(key);

    if (existing && existing.userId !== userId) return false;

    const lock: DocumentLock = {
      userId,
      model: model,
      recordId: id,
      timestamp: Date.now(),
    };
    await cacheService.set(key, lock, this.TTL);
    return true;
  }

  async unlock(model: string, id: string, userId: string): Promise<boolean> {
    const key = this.getKey(model, id);
    const existing = await cacheService.get<DocumentLock>(key);
    if (existing?.userId !== userId) return false;
    await cacheService.delete(key);
    return true;
  }

  async isLocked(model: string, id: string): Promise<DocumentLock | null> {
    return await cacheService.get<DocumentLock>(this.getKey(model, id));
  }
}
