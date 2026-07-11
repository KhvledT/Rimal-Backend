import app from "../app.js";
import { DB_Connection } from "../DB/dbconnection.js";
import UserModel from "../DB/Models/user.model.js";
import { RoleEnum } from "../enums/user.enums.js";
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_PASSWORD,
} from "../config/config.service.js";
import { loggerService } from "../Common/Logger/logger.service.js";

// Global cache variable to avoid database query overhead on every request
let isSuperAdminInitialized = false;

export default async function handler(req: any, res: any) {
  try {
    // 1. Initialize MongoDB connection safely (reusing cached connection)
    await DB_Connection();

    // 2. Safely initialize Default Super Admin in serverless environment
    if (!isSuperAdminInitialized) {
      const superAdmin = await UserModel.findOne({ role: RoleEnum.SuperAdmin }).lean();
      if (!superAdmin) {
        await UserModel.create({
          userName: "super_admin",
          email: DEFAULT_SUPER_ADMIN_EMAIL || "superadmin@rimal.com",
          password: DEFAULT_SUPER_ADMIN_PASSWORD || "SuperAdminPassword123",
          phone: "+974 4400 0000",
          role: RoleEnum.SuperAdmin,
        });
        loggerService.info(
          "Default Super Admin initialized successfully inside serverless handler",
        );
      }
      isSuperAdminInitialized = true;
    }
  } catch (error) {
    loggerService.error(
      "Failed to bootstrap serverless handler dependencies:",
      error,
    );
  }

  // 3. Delegate execution directly to the Express app instance
  return app(req, res);
}
export { handler };
