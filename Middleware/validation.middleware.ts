import type { NextFunction, Request, Response } from "express";
import { BadRequest } from "../Common/Exeptions/domain.error.js";
import type { ZodError, ZodType } from "zod";

type KeyReqType = keyof Request;

export function validation(Schema: Partial<Record<KeyReqType, ZodType>>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: { path: PropertyKey[]; message: string }[] = [];
    for (const key of Object.keys(Schema) as KeyReqType[]) {
      const result = Schema[key]!.safeParse(req[key]);

      if (!result.success) {
        validationErrors.push(...result.error.issues.map((err) => {
          return {
            path: err.path,
            message: err.message,
          };
        }));
      }
    }
    if (validationErrors.length > 0) {
      throw new BadRequest("Validation Error", validationErrors);
    }
    next();
  };
}
