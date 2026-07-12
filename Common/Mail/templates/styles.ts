import { COLORS } from "./colors.js";

export const EMAIL_STYLES = {
  // Page container
  bodyWrapper: `background-color: ${COLORS.sandWhite}; padding: 40px 10px; font-family: 'Open Sans', Arial, Helvetica, sans-serif;`,

  // Main container (600px width max)
  container: `max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(35, 44, 68, 0.06); border: 1px solid ${COLORS.lightBorder}; border-collapse: collapse;`,

  // Header section - Large Burgundy Header
  header: `background-color: ${COLORS.primaryBurgundy}; padding: 36px 24px; text-align: center; border-bottom: 4px solid ${COLORS.gold};`,

  // Title in header
  headerLogoText: `font-family: Montserrat, Arial, Helvetica, sans-serif; font-size: 30px; font-weight: bold; color: ${COLORS.white}; letter-spacing: 5px; line-height: 1.2;`,
  headerSubText: `font-family: Montserrat, Arial, Helvetica, sans-serif; font-size: 10px; font-weight: bold; color: ${COLORS.lightGold}; letter-spacing: 3px; text-transform: uppercase; padding-top: 6px; line-height: 1;`,

  // Content area
  contentBody: `padding: 40px 32px; color: ${COLORS.deepNavy}; line-height: 1.6; font-size: 15px; font-family: 'Open Sans', Arial, Helvetica, sans-serif;`,

  // Typography
  paragraph: `margin: 0 0 16px 0; font-size: 15px; color: ${COLORS.deepNavy}; line-height: 1.6;`,
  greeting: `font-family: Montserrat, Arial, Helvetica, sans-serif; font-size: 18px; font-weight: bold; color: ${COLORS.deepNavy}; margin-bottom: 12px;`,
  title: `font-family: Montserrat, Arial, Helvetica, sans-serif; font-size: 24px; font-weight: bold; color: ${COLORS.deepBurgundy}; margin: 0 0 12px 0; text-align: center;`,

  // Gold accent divider
  goldDivider: `border: 0; border-top: 2px solid ${COLORS.gold}; margin: 16px auto 24px auto; width: 60px;`,

  // OTP card wrapper/container
  otpCard: `background-color: ${COLORS.sandWhite}; border: 1px solid ${COLORS.gold}; border-radius: 6px; padding: 24px; text-align: center; margin: 32px 0;`,
  otpText: `font-family: Courier New, Courier, monospace; font-size: 40px; font-weight: bold; letter-spacing: 8px; color: ${COLORS.deepBurgundy}; margin: 0; padding-left: 8px; text-align: center;`,

  // Notices
  noticeText: `font-size: 14px; color: ${COLORS.deepNavy}; opacity: 0.8; margin: 0 0 8px 0; line-height: 1.5;`,
  securityNotice: `font-size: 13px; color: ${COLORS.deepNavy}; opacity: 0.7; margin-top: 24px; padding-top: 16px; border-top: 1px dashed ${COLORS.lightBorder}; line-height: 1.5;`,

  // Divider
  divider: `border: 0; border-top: 1px solid ${COLORS.lightBorder}; margin: 32px 0;`,

  // Footer
  footer: `padding: 32px 24px; background-color: ${COLORS.sandWhite}; border-top: 1px solid ${COLORS.lightBorder}; text-align: center; font-size: 12px; color: ${COLORS.deepNavy}; line-height: 1.8; font-family: 'Open Sans', Arial, Helvetica, sans-serif;`,
  footerLink: `color: ${COLORS.gold}; text-decoration: none; font-weight: bold;`,
};
