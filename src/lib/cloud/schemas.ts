import "server-only";
import { z } from "zod";
import { CLOUD_FOLDER_IDS } from "./folders";

const AGE = z.enum(["1", "2", "3", "4"]);
const DIRECTION = z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]);
/** От формата идват низове: "" → null, "true"/"false" → boolean. */
const emptyToNull = (v: unknown) => (v === "" || v === "all" ? null : v);
const toBool = (v: unknown) => (v === "true" ? true : v === "false" ? false : v);

export const CloudMetaSchema = z.object({
  title: z.string().trim().min(1, "Напишете заглавие.").max(140, "Заглавието е твърде дълго."),
  description: z.string().trim().max(600, "Описанието е твърде дълго.").default(""),
  folder: z.enum(CLOUD_FOLDER_IDS).default("other"),
  ageGroup: z.preprocess(emptyToNull, AGE.nullish()),
  direction: z.preprocess(emptyToNull, DIRECTION.nullish()),
  shared: z.preprocess(toBool, z.boolean()).default(true),
});

export type CloudMeta = z.infer<typeof CloudMetaSchema>;

export const UploadTokenSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  size: z.number().int().positive(),
});

export const RegisterBlobSchema = CloudMetaSchema.extend({
  pathname: z.string().min(10).max(400),
  fileName: z.string().trim().min(1).max(200),
});

export const CloudPatchSchema = z.object({
  title: CloudMetaSchema.shape.title.optional(),
  description: z.string().trim().max(600, "Описанието е твърде дълго.").optional(),
  folder: z.enum(CLOUD_FOLDER_IDS).optional(),
  ageGroup: z.preprocess(emptyToNull, AGE.nullable()).optional(),
  direction: z.preprocess(emptyToNull, DIRECTION.nullable()).optional(),
  shared: z.boolean().optional(),
});

export const CloudListQuery = z.object({
  scope: z.enum(["all", "mine", "private"]).default("all"),
  folder: z.enum(CLOUD_FOLDER_IDS).optional(),
  ageGroup: AGE.optional(),
  q: z.string().trim().max(80).optional(),
});
