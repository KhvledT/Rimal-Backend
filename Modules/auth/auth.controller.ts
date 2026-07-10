import express from "express";
import authService from "./auth.service.js";
import success from "../../Common/Response/success.response.js";
import { loginSchema, signupSchema } from "./auth.validation.js";
import { validation } from "../../Middleware/validation.middleware.js";

const authRouter: express.Router = express.Router();

authRouter.get("/", (req: express.Request, res: express.Response) => {
  res.json({ message: "Auth route" });
});

authRouter.post(
  "/login",
  validation(loginSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await authService.login(req.body);
      success({
        res,
        StatusCode: 200,
        result,
        message: "Login successful",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/signup",
  validation(signupSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await authService.signup(req.body);
      success({
        res,
        StatusCode: 201,
        result,
        message: "Registration successful",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default authRouter;
