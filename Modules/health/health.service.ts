import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import {
  NODE_ENV,
  STORAGE_PROVIDER,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET,
} from "../../config/config.service.js";
import { formatUptime } from "../../Common/utils/format.js";
import { loggerService } from "../../Common/Logger/logger.service.js";

function getPackageVersion(): string {
  try {
    const pkgPath = path.resolve("./package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

class HealthService {
  private getSupabaseClient() {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }

  async getHealthReport() {
    let dbStatus = "DOWN";
    let storageStatus = "DOWN";

    // 1. Database connectivity check
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db?.admin().ping();
        dbStatus = "UP";
      }
    } catch (err) {
      dbStatus = "DOWN";
      loggerService.error("Health Check Error [Database]:", err);
    }

    // 2. Storage connectivity check
    const provider = STORAGE_PROVIDER || "cloudinary";
    try {
      if (provider === "supabase") {
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_BUCKET) {
          const client = this.getSupabaseClient();
          const { data, error } = await client.storage
            .from(SUPABASE_BUCKET)
            .list("", { limit: 1 });

          if (!error && data) {
            storageStatus = "UP";
          } else if (error) {
            loggerService.error(
              "Health Check Error [Supabase Storage Listing]:",
              error,
            );
          }
        }
      } else if (provider === "cloudinary") {
        const result = await cloudinary.api.ping();
        if (result && result.status === "ok") {
          storageStatus = "UP";
        }
      }
    } catch (err: any) {
      storageStatus = "DOWN";
      loggerService.error("Health Check Error [Storage Connection]:", err);
    }

    const isHealthy = dbStatus === "UP" && storageStatus === "UP";
    const uptimeSec = process.uptime();

    const services = {
      server: {
        status: "UP",
      },
      database: {
        status: dbStatus,
        provider: "mongodb",
      },
      storage: {
        status: storageStatus,
        provider,
      },
    };

    return {
      message: isHealthy
        ? "Application is healthy"
        : "Application is unhealthy",
      result: {
        status: isHealthy ? "UP" : "DOWN",
        timestamp: new Date().toISOString(),
        environment: NODE_ENV === "production" ? "production" : "development",
        version: getPackageVersion(),
        uptime: {
          seconds: Math.floor(uptimeSec),
          human: formatUptime(uptimeSec),
        },
        runtime: {
          node: process.version,
        },
        services,
      },
    };
  }
}

export default new HealthService();
