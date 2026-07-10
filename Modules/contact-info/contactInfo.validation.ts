import z from "zod";

export const updateContactInfoSchema = {
  body: z.strictObject({
    address: z.string().min(1, "Address cannot be empty").optional(),
    emails: z.array(z.string().email("Invalid email format")).optional(),
    phones: z.array(z.string().min(1, "Phone cannot be empty")).optional(),
    linkedIn: z.string().min(1, "LinkedIn link cannot be empty").optional(),
    mapUrl: z.string().min(1, "Map URL cannot be empty").optional(),
  }),
};
