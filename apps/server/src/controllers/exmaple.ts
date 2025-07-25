import { ExampleService } from "@/main/example";
import { Request, Response, NextFunction } from "express";

const exampleService = new ExampleService();

export class ExampleController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exampleService.getAll(req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exampleService.getById(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exampleService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exampleService.update(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exampleService.delete(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exampleService.getHistory(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
