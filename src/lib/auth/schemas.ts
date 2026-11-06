import { z } from "zod";

// По модела на МатураПлюс (src/lib/auth/schemas.ts) — Zod валидация на входа и регистрацията.

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Невалиден имейл или парола"),
  password: z.string().min(1, "Невалиден имейл или парола"),
  /** false → бисквитката изтича при затваряне на браузъра */
  remember: z.boolean().optional(),
});

const AgeGroupSchema = z.enum(["1", "2", "3", "4"]);

export const RegisterSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Моля, въведи валиден имейл адрес."),
    password: z
      .string()
      .min(8, "Паролата трябва да е поне 8 символа.")
      .max(128, "Паролата е твърде дълга."),
    name: z.string().trim().min(2, "Моля, въведи име (напр. „Г-жа Петрова“).").max(80, "Името е твърде дълго."),
    jobTitle: z.string().trim().max(60).optional(),
    avatar: z.string().trim().max(16).optional(),
    ageGroup: AgeGroupSchema.default("2"),
    groupName: z.string().trim().max(80).optional(),
    /** create → нова детска градина; join → присъединяване с код от колега */
    mode: z.enum(["create", "join"]),
    kgName: z.string().trim().max(120).optional(),
    kgCity: z.string().trim().max(80).optional(),
    kgMotto: z.string().trim().max(160).optional(),
    joinCode: z.string().trim().max(20).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "create" && (!v.kgName || v.kgName.length < 3)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["kgName"], message: "Моля, въведи името на детската градина." });
    }
    if (v.mode === "join" && (!v.joinCode || v.joinCode.length < 6)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["joinCode"], message: "Моля, въведи кода, който ти е дал колега." });
    }
  });

export const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  jobTitle: z.string().trim().max(60).optional(),
  avatar: z.string().trim().max(16).optional(),
  ageGroup: AgeGroupSchema.optional(),
  groupName: z.string().trim().max(80).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
