import mongoose from "mongoose";
import {
  DB_ATLAS,
  MONGO_CONNECT_RETRIES,
  MONGO_CONNECT_DELAY_MS,
} from "../config/config.service.js";
import { loggerService } from "../Common/Logger/logger.service.js";

// Global cache variable to persist the connection promise across serverless warm restarts
let cachedConnectionPromise: Promise<typeof mongoose> | null = null;

export async function DB_Connection() {
  // 1. If connection is already open, reuse it immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2. If a connection is currently in progress, reuse the pending promise
  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  const isServerless = !!(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  );

  // 3. For Serverless execution (Vercel), use fast connection caching
  if (isServerless) {
    loggerService.info(
      "Serverless environment detected. Establishing database connection...",
    );
    cachedConnectionPromise = mongoose.connect(DB_ATLAS)
      .then((m) => {
        loggerService.info("MongoDB connected successfully (Serverless).");
        return m;
      })
      .catch((err) => {
        cachedConnectionPromise = null; // Clear cache on failure so next request can retry
        loggerService.error("MongoDB connection failed (Serverless):", err);
        throw err;
      });
    return cachedConnectionPromise;
  }

  // 4. For persistent local/server environments, use the startup retry loop
  loggerService.info("Connecting to MongoDB...");
  let lastError: any;

  for (let attempt = 1; attempt <= MONGO_CONNECT_RETRIES; attempt++) {
    try {
      await mongoose.connect(DB_ATLAS);
      loggerService.info("MongoDB connected successfully.");
      return mongoose;
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
