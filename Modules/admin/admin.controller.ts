import express from "express";
import adminService from "./admin.service.js";
import success from "../../Common/Response/success.response.js";
import { adminActionSchema } from "./admin.validation.js";
import { validation } from "../../Middleware/validation.middleware.js";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { RoleEnum } from "../../enums/user.enums.js";

const adminRouter: express.Router = express.Router();

// Apply Super Admin restriction globally to all admin management endpoints
adminRouter.use(authentication([RoleEnum.SuperAdmin]));

adminRouter.get(
  "/users",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await adminService.listUsers();
      success({
        res,
        StatusCode: 200,
        result,
        message: "Users list retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.get(
  "/admins",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await adminService.listAdmins();
      success({
        res,
        StatusCode: 200,
        result,
        message: "Admins list retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.patch(
  "/promote/:id",
  validation(adminActionSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await adminService.promoteUser(req.params.id as string);
      success({
        res,
        StatusCode: 200,
        result,
        message: "User promoted to Admin successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.patch(
  "/demote/:id",
  validation(adminActionSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await adminService.demoteAdmin(req.params.id as string);
      success({
        res,
        StatusCode: 200,
        result,
        message: "Admin demoted to User successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default adminRouter;
