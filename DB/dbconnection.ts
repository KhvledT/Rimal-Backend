import mongoose from "mongoose";
import {
  DB_LOCAL,
  MONGO_CONNECT_RETRIES,
  MONGO_CONNECT_DELAY_MS,
} from "../config/config.service.js";
import { loggerService } from "../Common/Logger/logger.service.js";

export async function DB_Connection() {
  if (mongoose.connection.readyState === 1) {
    loggerService.info("MongoDB connection already active. Reusing cached connection.");
    return;
  }
  loggerService.info("Connecting to MongoDB...");

  let lastError: any;
  for (let attempt = 1; attempt <= MONGO_CONNECT_RETRIES; attempt++) {
    try {
      await mongoose.connect(DB_LOCAL);
      loggerService.info("MongoDB connected successfully.");
      return;
    } catch (error) {
      lastError = error;
      loggerService.error(
        `MongoDB connection failed (Attempt ${attempt}/${MONGO_CONNECT_RETRIES})`,
        error,
      );
      if (attempt < MONGO_CONNECT_RETRIES) {
        loggerService.info(`Retrying in ${MONGO_CONNECT_DELAY_MS} ms...`);
        await new Promise((resolve) =>
          setTimeout(resolve, MONGO_CONNECT_DELAY_MS),
        );
      }
    }
  }

  throw (
    lastError || new Error("Failed to connect to MongoDB after all retries.")
  );
}
