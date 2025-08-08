export class LockingService {
  async acquireLock(resourceId: string, socketId: string): Promise<boolean> {
    return true;
  }

  async renewLock(resourceId: string, socketId: string): Promise<boolean> {
    return true;
  }

  async releaseLock(resourceId: string, socketId: string): Promise<boolean> {
    return true;
  }

  async forceReleaseLock(resourceId: string): Promise<boolean> {
    return true;
  }

  async isLocked(resourceId: string): Promise<{
    locked: boolean;
    owner?: string;
  }> {
    return { locked: false };
  }
}
