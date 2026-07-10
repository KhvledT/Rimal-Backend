import express from "express";
import authRouter from "./Modules/auth/auth.controller.js";
import contactRouter from "./Modules/contact/contact.controller.js";
import teamRouter from "./Modules/team/team.controller.js";
import contactInfoRouter from "./Modules/contact-info/contactInfo.controller.js";
import globalErrorHandler from "./Middleware/globalErr.middleware.js";
import { SERVER_PORT } from "./config/config.service.js";
import { DB_Connection } from "./DB/dbconnection.js";
import corporateProfileRouter from "./Modules/corporate-profile/corporateProfile.controller.js";

async function bootstrap() {
  await DB_Connection();
  const app: express.Express = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  app.use("/contact", contactRouter);
  app.use("/team", teamRouter);
  app.use("/contact-info", contactInfoRouter);
  app.use("/corporate-profile", corporateProfileRouter);

  app.use(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.json({ message: "Welcome to the API" });
    },
  );

  app.use(globalErrorHandler);

  app.listen(SERVER_PORT, () => {
    console.log(`Server is running on port ${SERVER_PORT}`);
  });
}

export default bootstrap;
