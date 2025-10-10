export class JourneyController {
    async createJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourneys(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Journey>(req.query);
      const result = await journeyService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.getById(req.params.journeyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.update(req.params.journeyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.delete(req.params.journeyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}