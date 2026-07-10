import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// 1. Resolve and Validate NODE_ENV value
export const NODE_ENV = process.env.NODE_ENV || "development";

const allowedEnvs = ["development", "production", "test"];
if (!allowedEnvs.includes(NODE_ENV)) {
  throw new Error(`Unsupported NODE_ENV: ${NODE_ENV}`);
}

// 2. Resolve and verify environment file path
const envFileName = `.env.${NODE_ENV}`;
const envFilePath = path.resolve(envFileName);

if (!fs.existsSync(envFilePath)) {
  throw new Error(`Environment file does not exist: ${envFilePath}`);
}

// Load configuration variables
dotenv.config({ path: envFilePath });

// 3. Define and validate required variables
const requiredVars = [
  "DB_LOCAL",
  "SERVER_PORT",
  "SALT_ROUNDS",
  "ENCRYPTION_KEY",
  "JWT_SECRET_ACCESS_USER",
  "JWT_SECRET_ACCESS_ADMIN",
  "JWT_SECRET_REFRESH_USER",
  "JWT_SECRET_REFRESH_ADMIN",
  "NODEMAILER_USER",
  "NODEMAILER_PASS",
  "STORAGE_PROVIDER",
  "DEFAULT_SUPER_ADMIN_EMAIL",
  "DEFAULT_SUPER_ADMIN_PASSWORD",
];

const missingVars = requiredVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables in ${envFileName}: ${missingVars.join(", ")}`,
  );
}

// Validate provider-specific required variables
const provider = process.env.STORAGE_PROVIDER;
if (provider === "supabase") {
  const supabaseVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_BUCKET",
  ];
  const missingSupabase = supabaseVars.filter((v) => !process.env[v]);
  if (missingSupabase.length > 0) {
    throw new Error(
      `Missing required Supabase variables in ${envFileName}: ${missingSupabase.join(", ")}`,
    );
  }
} else if (provider === "cloudinary") {
  const cloudinaryVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missingCloudinary = cloudinaryVars.filter((v) => !process.env[v]);
  if (missingCloudinary.length > 0) {
    throw new Error(
      `Missing required Cloudinary variables in ${envFileName}: ${missingCloudinary.join(", ")}`,
    );
  }
} else {
  throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
}

// Log application startup environment
console.log(`Environment: ${NODE_ENV}`);

// 4. Export all parsed variables
export const DB_LOCAL = process.env.DB_LOCAL || "";
export const SERVER_PORT = +process.env.SERVER_PORT!;
export const SALT_ROUNDS = +process.env.SALT_ROUNDS!;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

export const JWT_SECRET_ACCESS_USER = process.env.JWT_SECRET_ACCESS_USER as string;
export const JWT_SECRET_ACCESS_ADMIN = process.env.JWT_SECRET_ACCESS_ADMIN as string;
export const JWT_SECRET_REFRESH_USER = process.env.JWT_SECRET_REFRESH_USER as string;
export const JWT_SECRET_REFRESH_ADMIN = process.env.JWT_SECRET_REFRESH_ADMIN as string;

export const NODEMAILER_USER = process.env.NODEMAILER_USER as string;
export const NODEMAILER_PASS = process.env.NODEMAILER_PASS as string;

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME as string;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY as string;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET as string;

export const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER as string;
export const SUPABASE_URL = process.env.SUPABASE_URL as string;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET as string;

export const DEFAULT_SUPER_ADMIN_EMAIL = process.env.DEFAULT_SUPER_ADMIN_EMAIL as string;
export const DEFAULT_SUPER_ADMIN_PASSWORD = process.env.DEFAULT_SUPER_ADMIN_PASSWORD as string;

/**
 * Rate Limiting Configurations (safe defaults)
 */
export const RATE_LIMIT_LOGIN_MAX = +(process.env.RATE_LIMIT_LOGIN_MAX || 5);
export const RATE_LIMIT_LOGIN_WINDOW = +(process.env.RATE_LIMIT_LOGIN_WINDOW || 15 * 60 * 1000);

export const RATE_LIMIT_SIGNUP_MAX = +(process.env.RATE_LIMIT_SIGNUP_MAX || 3);
export const RATE_LIMIT_SIGNUP_WINDOW = +(process.env.RATE_LIMIT_SIGNUP_WINDOW || 60 * 60 * 1000);

export const RATE_LIMIT_VERIFY_MAX = +(process.env.RATE_LIMIT_VERIFY_MAX || 5);
export const RATE_LIMIT_VERIFY_WINDOW = +(process.env.RATE_LIMIT_VERIFY_WINDOW || 15 * 60 * 1000);

export const RATE_LIMIT_RESEND_MAX = +(process.env.RATE_LIMIT_RESEND_MAX || 3);
export const RATE_LIMIT_RESEND_WINDOW = +(process.env.RATE_LIMIT_RESEND_WINDOW || 15 * 60 * 1000);

export const RATE_LIMIT_CONTACT_MAX = +(process.env.RATE_LIMIT_CONTACT_MAX || 5);
export const RATE_LIMIT_CONTACT_WINDOW = +(process.env.RATE_LIMIT_CONTACT_WINDOW || 60 * 60 * 1000);

export const MONGO_CONNECT_RETRIES = +(process.env.MONGO_CONNECT_RETRIES || 5);
export const MONGO_CONNECT_DELAY_MS = +(process.env.MONGO_CONNECT_DELAY_MS || 3000);


