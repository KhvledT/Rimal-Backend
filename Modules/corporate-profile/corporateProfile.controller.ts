import express from "express";
import { authentication } from "../../Middleware/authentication.middleware.js";
import success from "../../Common/Response/success.response.js";
import { BadRequest } from "../../Common/Exeptions/domain.error.js";
import cloudFileUpload from "../../Common/multer/multer.config.js";
import { allowedFileFormats } from "../../Common/multer/multer.validation.js";
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

corporateProfileRouter.put(
  "/",
  authentication(),
  cloudFileUpload({
    allowedFormats: allowedFileFormats.pdf,
    fileSize: 100, // 100 MB max size
  }).single("file"),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      if (!req.file) {
        throw new BadRequest("PDF file is required in 'file' field");
      }
      const result = await corporateProfileService.updateProfile(req.file);
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
