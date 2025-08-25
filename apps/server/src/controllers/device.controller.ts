import type { NtfyDevice } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { deviceService } from "@/services";
import { ntfyDeviceService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class DeviceController {
  //   // Devices
  async createDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.create(req.body);
      await deviceService.reload();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<NtfyDevice>(req.query);
      const result = await ntfyDeviceService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.getById(req.params.deviceId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.update(req.params.deviceId, req.body);
      await deviceService.reload();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ntfyDeviceService.delete(req.params.deviceId);
      await deviceService.reload();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Testing
  async sendTestNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      await deviceService.sendTestNotification(message);
      res.status(200).json({ success: true, message: "Test notification sent!" });
    }
    catch (error) {
      next(error);
    }
  }
}
