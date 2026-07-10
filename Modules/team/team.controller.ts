import express from "express";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { validation } from "../../Middleware/validation.middleware.js";
import success from "../../Common/Response/success.response.js";
import cloudFileUpload from "../../Common/multer/multer.config.js";
import { allowedFileFormats } from "../../Common/multer/multer.validation.js";
import teamService from "./team.service.js";
import * as teamValidation from "./team.validation.js";

const teamRouter: express.Router = express.Router();

teamRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await teamService.listTeamMembers();
      success({
        res,
        result,
        message: "Team members retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

teamRouter.post(
  "/",
  authentication(),
  cloudFileUpload({
    allowedFormats: allowedFileFormats.img,
    fileSize: 5,
  }).single("photo"),
  validation(teamMemberSchemaBody(teamValidation.createTeamMemberSchema)),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await teamService.createTeamMember(req.body, req.file);
      success({
        res,
        StatusCode: 201,
        result,
        message: "Team member created successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

teamRouter.put(
  "/:id",
  authentication(),
  cloudFileUpload({
    allowedFormats: allowedFileFormats.img,
    fileSize: 5,
  }).single("photo"),
  validation(teamValidation.updateTeamMemberSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await teamService.updateTeamMember(
        req.params.id as string,
        req.body,
        req.file,
      );
      success({
        res,
        result,
        message: "Team member updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

teamRouter.delete(
  "/:id",
  authentication(),
  validation(teamValidation.getTeamMemberDetailsSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await teamService.deleteTeamMember(req.params.id as string);
      success({
        res,
        message: "Team member deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Helper function to extract schema if needed or directly pass it
function teamMemberSchemaBody(schema: any) {
  return schema;
}

export default teamRouter;
