import { z } from "zod";

// По модела на МатураПлюс (src/lib/auth/schemas.ts) — Zod валидация на входа и регистрацията.

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Невалиден имейл или парола"),
  password: z.string().min(1, "Невалиден имейл или парола"),
  /** false → бисквитката изтича при затваряне на браузъра */
  remember: z.boolean().optional(),
});

const AgeGroupSchema = z.enum(["1", "2", "3", "4"]);

// Облакът е само на ДГ „Пролет“: регистрацията е винаги присъединяване с код
// (първият профил — без код, става администратор). Старите полета за нова градина се игнорират.
export const RegisterSchema = z.object({
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
    /** (Остаряло) Сайтът е на една градина — полето се игнорира */
    mode: z.enum(["create", "join"]).optional(),
    kgName: z.string().trim().max(120).optional(),
    kgCity: z.string().trim().max(80).optional(),
    kgMotto: z.string().trim().max(160).optional(),
    joinCode: z.string().trim().max(20).optional(),
  });

export const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  showcaseBio: z.string().trim().max(400, "Представянето е твърде дълго.").optional(),
  jobTitle: z.string().trim().max(60).optional(),
  avatar: z.string().trim().max(16).optional(),
  ageGroup: AgeGroupSchema.optional(),
  groupName: z.string().trim().max(80).optional(),
});

const NewPassword = z.string().min(8, "Паролата трябва да е поне 8 символа.").max(128, "Паролата е твърде дълга.");

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Моля, въведете валиден имейл адрес."),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, "Линкът е невалиден.").max(200, "Линкът е невалиден."),
  password: NewPassword,
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Въведете сегашната си парола."),
  newPassword: NewPassword,
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
