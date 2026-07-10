import express from "express";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { validation } from "../../Middleware/validation.middleware.js";
import success from "../../Common/Response/success.response.js";
import contactInfoService from "./contactInfo.service.js";
import * as contactInfoValidation from "./contactInfo.validation.js";

const contactInfoRouter: express.Router = express.Router();

contactInfoRouter.get(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await contactInfoService.getContactInfo();
      success({
        res,
        result,
        message: "Contact info retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

contactInfoRouter.put(
  "/",
  authentication(),
  validation(contactInfoValidation.updateContactInfoSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await contactInfoService.updateContactInfo(req.body);
      success({
        res,
        result,
        message: "Contact info updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default contactInfoRouter;
