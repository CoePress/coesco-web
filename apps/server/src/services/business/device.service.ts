import axios from "axios";
import ping from "ping";

import { logger } from "@/utils/logger";

import { ntfyDeviceService } from "../repository";

export class DeviceService {
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private defaultTopic = "deez_nuts";

  // Ping Operations
  async pingDevice(deviceId: string): Promise<boolean> {
    const device = await ntfyDeviceService.getById(deviceId);
    if (!device.success || !device.data) {
      throw new Error(`Device ${deviceId} not found`);
    }

    try {
      const res = await ping.promise.probe(device.data.host, {
        timeout: 5, // seconds
      });

      const isAlive = res.alive;

      await ntfyDeviceService.update(deviceId, {
        lastPingTime: new Date(),
        lastPingSuccess: isAlive,
      });

      return isAlive;
    }
    catch {
      await ntfyDeviceService.update(deviceId, {
        lastPingTime: new Date(),
        lastPingSuccess: false,
      });
      return false;
    }
  }

  async pingAllEnabledDevices(): Promise<void> {
    const devices = await ntfyDeviceService.getAll({
      filter: { enabled: true },
    });

    if (!devices.success)
      return;

    const promises = devices.data.map(async (device) => {
      const success = await this.pingDevice(device.id);
      if (success) {
        await this.handlePingSuccess(device.id);
      }
      else {
        await this.handlePingFailure(device.id);
      }
    });

    await Promise.all(promises);
  }

  // Status Management
  async handlePingSuccess(deviceId: string): Promise<void> {
    const device = await ntfyDeviceService.getById(deviceId);
    if (!device.success || !device.data)
      return;

    const wasDown = device.data.isDown;

    await ntfyDeviceService.update(deviceId, {
      currentMissedPings: 0,
      isDown: false,
    });

    if (wasDown) {
      await this.sendUpAlert(deviceId);
    }
  }

  async handlePingFailure(deviceId: string): Promise<void> {
    const device = await ntfyDeviceService.getById(deviceId);
    if (!device.success || !device.data)
      return;

    const newMissedCount = device.data.currentMissedPings + 1;
    const shouldAlert = newMissedCount >= device.data.maxMissedPings && !device.data.isDown;

    await ntfyDeviceService.update(deviceId, {
      currentMissedPings: newMissedCount,
      isDown: newMissedCount >= device.data.maxMissedPings,
    });

    if (shouldAlert) {
      await this.sendDownAlert(deviceId);
    }
  }

  // Notification System
  async sendDownAlert(deviceId: string): Promise<void> {
    const device = await ntfyDeviceService.getById(deviceId);
    if (!device.success || !device.data)
      return;

    const message = `🔴 Device DOWN: ${device.data.name} (${device.data.host}) is unreachable`;
    await this.sendToNtfy(this.defaultTopic, message);
  }

  async sendUpAlert(deviceId: string): Promise<void> {
    const device = await ntfyDeviceService.getById(deviceId);
    if (!device.success || !device.data)
      return;

    const message = `🟢 Device UP: ${device.data.name} (${device.data.host}) is back online`;
    await this.sendToNtfy(this.defaultTopic, message);
  }

  async sendToNtfy(topic: string, message: string): Promise<void> {
    await axios.post(`https://ntfy.sh/${topic}`, message, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  // Test notification method
  async sendTestNotification(message?: string): Promise<void> {
    const testMessage = message || `🧪 Test notification from CP Status Monitor - ${new Date().toISOString()}`;
    await this.sendToNtfy(this.defaultTopic, testMessage);
  }

  // Monitoring Control
  async initialize(): Promise<void> {
    if (this.isMonitoring)
      return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.pingAllEnabledDevices();
    }, 10000);
  }

  async shutdown(): Promise<void> {
    if (!this.isMonitoring)
      return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  async reload(): Promise<void> {
    logger.info("Reloading device monitoring...");
    await this.shutdown();
    await this.initialize();
  }
}
