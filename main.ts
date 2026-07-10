import app from "./app.js";
import mongoose from "mongoose";
import {
  SERVER_PORT,
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_PASSWORD,
  NODE_ENV,
} from "./config/config.service.js";
import { DB_Connection } from "./DB/dbconnection.js";
import UserModel from "./DB/Models/user.model.js";
import { RoleEnum } from "./enums/user.enums.js";
import { loggerService } from "./Common/Logger/logger.service.js";

async function startLocalServer() {
  try {
    // 1. Connect MongoDB with retries before exposing server
    await DB_Connection();

    // 2. Run migrations for singleton models (ensure existing documents have isSingleton = true)
    const CorporateProfileModel = (
      await import("./DB/Models/corporateProfile.model.js")
    ).default;
    const ContactInfoModel = (await import("./DB/Models/contactInfo.model.js"))
      .default;
    const SessionModel = (await import("./DB/Models/session.model.js")).default;
    const OtpModel = (await import("./DB/Models/otp.model.js")).default;

    await CorporateProfileModel.updateMany(
      { isSingleton: { $ne: true } },
      { $set: { isSingleton: true } },
    );
    await ContactInfoModel.updateMany(
      { isSingleton: { $ne: true } },
      { $set: { isSingleton: true } },
    );

    // Sync mongoose indexes only in development (forces building unique/TTL/compound indexes immediately)
    if (NODE_ENV === "development") {
      loggerService.info(
        "Development environment detected: Synchronizing mongoose indexes.",
      );
      await UserModel.syncIndexes();
      await CorporateProfileModel.syncIndexes();
      await ContactInfoModel.syncIndexes();
      await SessionModel.syncIndexes();
      await OtpModel.syncIndexes();
    } else {
      loggerService.info(
        `Environment is ${NODE_ENV}: Skipping automatic index synchronization.`,
      );
    }
  } catch (error) {
    loggerService.error(
      "Critical error during MongoDB connection or indexing setup. Terminating application.",
      error,
    );
    process.exit(1);
  }

  // 3. Automatic Super Admin initialization on startup
  try {
    const superAdmin = await UserModel.findOne({ role: RoleEnum.SuperAdmin });
    if (!superAdmin) {
      await UserModel.create({
        userName: "super_admin",
        email: DEFAULT_SUPER_ADMIN_EMAIL || "superadmin@rimal.com",
        password: DEFAULT_SUPER_ADMIN_PASSWORD || "SuperAdminPassword123",
        phone: "+974 4400 0000",
        role: RoleEnum.SuperAdmin,
      });
      loggerService.info("Default Super Admin initialized successfully");
    }
  } catch (err) {
    loggerService.error("Failed to initialize Default Super Admin:", err);
  }

  const server = app.listen(SERVER_PORT, () => {
    loggerService.info(`Server started on port ${SERVER_PORT}.`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    loggerService.info(
      `Received signal: ${signal}. Commencing graceful shutdown...`,
    );

    // Stop accepting HTTP requests
    server.close(() => {
      loggerService.info("HTTP server closed.");

      // Close MongoDB connection
      mongoose.connection
        .close()
        .then(() => {
          loggerService.info("MongoDB connection closed.");
          process.exit(0);
        })
        .catch((err) => {
          loggerService.error("Error closing MongoDB connection:", err);
          process.exit(1);
        });
    });

    // Fallback: Force shutdown after 10s if sockets are hung
    setTimeout(() => {
      loggerService.error("Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

startLocalServer();