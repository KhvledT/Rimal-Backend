import express from "express";
import healthService from "./health.service.js";

const healthRouter: express.Router = express.Router();

healthRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const report = await healthService.getHealthReport();
      const isHealthy = report.result.status === "UP";

      res.status(isHealthy ? 200 : 503).json(report);
    } catch (error) {
      next(error);
    }
  },
);

export default healthRouter;
