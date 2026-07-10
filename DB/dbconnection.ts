import { connect } from "mongoose";
import { DB_LOCAL } from "../config/config.service.js";

export async function DB_Connection() {
  try {
    await connect(DB_LOCAL);
    console.log("Connected to the database successfully");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}
