import z from "zod";

export const createTeamMemberSchema = {
  body: z.strictObject({
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
    department: z.string().min(1, "Department is required"),
    email: z.string().email("Invalid email format"),
    photo: z.string().min(1).optional(),
    description: z.string().min(1, "Description is required"),
    expertise: z.array(z.string()).default([]),
    linkedin: z.string().url("Invalid URL format").optional(),
  }),
};

export const updateTeamMemberSchema = {
  body: z.strictObject({
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    department: z.string().min(1).optional(),
    email: z.string().email("Invalid email format").optional(),
    photo: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    expertise: z.array(z.string()).optional(),
    linkedin: z.string().url("Invalid URL format").optional(),
  }),
  params: z.strictObject({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
};

export const getTeamMemberDetailsSchema = {
  params: z.strictObject({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  }),
};
