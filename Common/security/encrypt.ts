import CryptoJS from "crypto-js";
import { ENCRYPTION_KEY } from "../../config/config.service.js";

export function encrptValue({
  value,
  key = ENCRYPTION_KEY,
}: {
  value: string;
  key?: string;
}) {
  return CryptoJS.AES.encrypt(value, key).toString();
}

export function decrptValue({
  cipherText,
  key = ENCRYPTION_KEY,
}: {
  cipherText: string;
  key?: string;
}) {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}
