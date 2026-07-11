import nodemailer from "nodemailer";
import {
  NODEMAILER_USER,
  NODEMAILER_PASS,
} from "../../config/config.service.js";
import { loggerService } from "../Logger/logger.service.js";

class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: NODEMAILER_USER,
        pass: NODEMAILER_PASS,
      },
    });
  }

  async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      await this.transporter.sendMail({
        from: `"Rimal Group" <${NODEMAILER_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      loggerService.error("Failed to send mail:", error);
      throw new Error("SMTP mail transmission failed");
    }
  }
}

export const mailService = new MailService();
