import { z } from "zod";

export const monitoringModeSchema = z.enum(["full_page", "text", "selector"]);

export const monitorStatusSchema = z.enum(["active", "paused"]);

const monitorFields = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Monitor name is required")
    .max(100, "Monitor name must be 100 characters or less"),

  url: z.string().trim().url("A valid URL is required"),

  monitoringMode: monitoringModeSchema,

  selector: z.string().trim().max(500, "Selector is too long").optional(),

  frequencyMinutes: z.number().int().min(5).max(10080),
});

function validateMonitorFields(
  data: { monitoringMode?: string; selector?: string },
  ctx: z.RefinementCtx,
) {
  if (data.monitoringMode === "selector" && !data.selector) {
    ctx.addIssue({
      code: "custom",
      path: ["selector"],
      message: "Selector is required for selector monitoring",
    });
  }

  if (data.monitoringMode !== "selector" && data.selector) {
    ctx.addIssue({
      code: "custom",
      path: ["selector"],
      message: "Selector is only allowed in selector mode",
    });
  }
}

export const createMonitorSchema = monitorFields.superRefine(
  validateMonitorFields,
);

export const updateMonitorSchema = monitorFields
  .partial()
  .superRefine(validateMonitorFields);

export const monitorIdSchema = z.object({
  id: z.string().uuid(),
});

export const registerSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  name: z.string().trim().min(1, "Name is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type MonitoringMode = z.infer<typeof monitoringModeSchema>;
export type MonitorStatus = z.infer<typeof monitorStatusSchema>;

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;

export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
