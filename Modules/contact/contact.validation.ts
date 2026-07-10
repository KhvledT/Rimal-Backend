import z from "zod";

export const createContactSchema = {
  body: z.strictObject({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be at most 100 characters long"),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must be at most 255 characters long"),
    phone: z
      .string()
      .min(1, "Phone is required")
      .max(50, "Phone must be at most 50 characters long"),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters long")
      .max(1000, "Message must be at most 1000 characters long"),
  }),
};

export const getContactDetailsSchema = {
  params: z.strictObject({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
};
