import express from "express";
import { authentication } from "../../Middleware/authentication.middleware.js";
import success from "../../Common/Response/success.response.js";
import corporateProfileService from "./corporateProfile.service.js";

const corporateProfileRouter: express.Router = express.Router();

corporateProfileRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await corporateProfileService.getProfile();
      success({
        res,
        result,
        message: "Corporate profile retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

corporateProfileRouter.get(
  "/download",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { stream, originalFilename, mimeType } =
        await corporateProfileService.getProfileForDownload();

      // Configure headers for secure backend streaming and attachment forcing
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(originalFilename)}"`,
      );
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

      // Pipe the active storage provider binary stream directly to client response
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },
);

corporateProfileRouter.get(
  "/upload-url",
  authentication(),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await corporateProfileService.generateUploadUrl();
      success({
        res,
        result,
        message: "Upload URL generated successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

corporateProfileRouter.put(
  "/",
  authentication(),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await corporateProfileService.updateProfileMetadata(
        req.body,
      );
      success({
        res,
        result,
        message: "Corporate profile uploaded successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

corporateProfileRouter.delete(
  "/",
  authentication(),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await corporateProfileService.deleteProfile();
      success({
        res,
        message: "Corporate profile deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default corporateProfileRouter;
export { corporateProfileRouter };
