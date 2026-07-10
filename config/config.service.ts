import dotenv from "dotenv";
import path from "path";

export const NODE_ENV = process.env.NODE_ENV || "dev";

// Load configuration parameters from the local .env.dev environment file
dotenv.config({
  path: path.resolve("./.env.dev"),
});

/**
 * MongoDB connection URI (e.g., 'mongodb://localhost:27017/rimal_db')
 * Used inside app.bootstrap.ts to bootstrap the database connectivity.
 */
export const DB_LOCAL = process.env.DB_LOCAL || "";

/**
 * Express HTTP listening port (e.g., 3000)
 */
export const SERVER_PORT = +process.env.SERVER_PORT!;

/**
 * Number of salt rounds for bcrypt password hashing (e.g., 10)
 * Used inside DB/Models/user.model.ts for admin registrations.
 */
export const SALT_ROUNDS = +process.env.SALT_ROUNDS!;

/**
 * Symmetric encryption key used by CryptoJS to encrypt/decrypt sensitive fields (e.g., phone numbers).
 */
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

/**
 * JWT secret keys used for token signatures and authentication.
 * Configured inside Common/security/token.ts and Middleware/authentication.middleware.ts.
 */
export const JWT_SECRET_ACCESS_USER = process.env.JWT_SECRET_ACCESS_USER as string;
export const JWT_SECRET_ACCESS_ADMIN = process.env.JWT_SECRET_ACCESS_ADMIN as string;
export const JWT_SECRET_REFRESH_USER = process.env.JWT_SECRET_REFRESH_USER as string;
export const JWT_SECRET_REFRESH_ADMIN = process.env.JWT_SECRET_REFRESH_ADMIN as string;

/**
 * Nodemailer mail server credentials.
 * Configured under Common/Email/ for notification services.
 */
export const NODEMAILER_USER = process.env.NODEMAILER_USER as string;
export const NODEMAILER_PASS = process.env.NODEMAILER_PASS as string;

/**
 * Cloudinary API credentials.
 * Required to upload, replace, and delete PDF files in the Corporate Profile module.
 */
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME as string;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY as string;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET as string;

/**
 * Storage Abstraction Configuration
 */
export const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER as string;
export const SUPABASE_URL = process.env.SUPABASE_URL as string;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET as string;

