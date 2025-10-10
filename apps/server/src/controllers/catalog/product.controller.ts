export class ProductController {
    async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Item>(req.query);
      const result = await itemService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

    async createProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getProductClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<ProductClass>(req.query);
      const result = await productClassService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}