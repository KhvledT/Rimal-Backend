import express from "express";
import cors from "cors";
import authRouter from "./Modules/auth/auth.controller.js";
import contactRouter from "./Modules/contact/contact.controller.js";
import teamRouter from "./Modules/team/team.controller.js";
import contactInfoRouter from "./Modules/contact-info/contactInfo.controller.js";
import globalErrorHandler from "./Middleware/globalErr.middleware.js";
import corporateProfileRouter from "./Modules/corporate-profile/corporateProfile.controller.js";
import adminRouter from "./Modules/admin/admin.controller.js";
import healthRouter from "./Modules/health/health.controller.js";

const app: express.Express = express();

app.set("trust proxy", 1);

// Configure CORS correctly with support for Vercel/production domains via env configs
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use("/auth", authRouter);
app.use("/contact", contactRouter);
app.use("/team", teamRouter);
app.use("/contact-info", contactInfoRouter);
app.use("/corporate-profile", corporateProfileRouter);
app.use("/admin", adminRouter);
app.use("/health", healthRouter);

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

export default app;
export { app };
