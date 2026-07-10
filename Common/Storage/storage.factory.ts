import {
  STORAGE_PROVIDER,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET,
} from "../../config/config.service.js";
import type { IStorageProvider } from "./storage.interface.js";
import { SupabaseStorageProvider } from "./providers/supabase.provider.js";
import { CloudinaryStorageProvider } from "./providers/cloudinary.provider.js";

export class StorageFactory {
  private static instance: IStorageProvider;

  public static getProvider(): IStorageProvider {
    if (this.instance) {
      return this.instance;
    }

    const provider = STORAGE_PROVIDER || "cloudinary";

    if (provider === "supabase") {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET) {
        throw new Error("Supabase storage configuration is missing");
      }
      this.instance = new SupabaseStorageProvider(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_BUCKET,
      );
    } else if (provider === "cloudinary") {
      this.instance = new CloudinaryStorageProvider();
    } else {
      throw new Error(`Unsupported storage provider: ${provider}`);
    }

    return this.instance;
  }
}
