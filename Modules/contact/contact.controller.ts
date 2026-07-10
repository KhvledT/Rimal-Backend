import express from "express";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { validation } from "../../Middleware/validation.middleware.js";
import success from "../../Common/Response/success.response.js";
import contactService from "./contact.service.js";
import * as contactValidation from "./contact.validation.js";

const contactRouter: express.Router = express.Router();

contactRouter.post(
  "/",
  validation(contactValidation.createContactSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await contactService.createContact(req.body);
      success({
        res,
        StatusCode: 201,
        result,
        message: "Message Sent Successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

contactRouter.get(
  "/",
  authentication(),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const page = +(req.query.page || 1);
      const limit = +(req.query.limit || 20);
      const result = await contactService.listContacts(page, limit);
      success({
        res,
        result,
        message: "Messages Retrieved Successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

contactRouter.delete(
  "/:id",
  authentication(),
  validation(contactValidation.getContactDetailsSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await contactService.deleteContact(req.params.id as string);
      success({
        res,
        message: "Message Deleted Successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default contactRouter;
