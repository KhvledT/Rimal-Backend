import { hash, compare } from "bcrypt";
import { SALT_ROUNDS } from "../../config/config.service.js";

export async function hashOperation({
  plainText,
  rounds = SALT_ROUNDS,
}: {
  plainText: string;
  rounds?: number;
}) {
  return await hash(plainText, rounds);
}

export async function compareOperation({
  plainValue,
  hashedValue,
}: {
  plainValue: string;
  hashedValue: string;
}) {
  return await compare(plainValue, hashedValue);
}
 