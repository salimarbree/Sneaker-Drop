import { z, ZodError } from "zod";
import { AppError } from "./errors.js";

export const zodSafeParse = <T>(data: unknown, schema: z.ZodSchema<T>): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = getZodErrorMessages(result.error);
    throw new AppError(message, "BAD_REQUEST", 400);
  }
  return result.data;
};

export const getZodErrorMessages = (error: ZodError, isUnionError?: boolean): string => {
  const err = error.errors[0];
  const path = err.path.length
    ? err.path.at(-1) + (err.path.length > 1 ? " in " + err.path.at(-2) : "")
    : "Value";

  if (err.code === "invalid_type") {
    return `${path}: Expected type ${err.expected}, but received ${err.received}.`;
  } else if (err.code === "invalid_literal") {
    return `${path}: Invalid literal value, expected ${err.expected}.`;
  } else if (err.code === "too_small") {
    return `${path}: Value is too small. Minimum allowed is ${err.minimum}${err.type === "string" ? " characters" : ""}.`;
  } else if (err.code === "too_big") {
    return `${path}: Value is too big. Maximum allowed is ${err.maximum}${err.type === "string" ? " characters" : ""}.`;
  } else if (err.code === "invalid_enum_value") {
    return `${path}: Invalid enum value. Expected one of ${err.options.join(", ")}.`;
  } else if (err.code === "invalid_union_discriminator") {
    return `${path}: Invalid discriminator value. Expected one of ${err.options.join(", ")}.`;
  } else if (err.code === "invalid_date") {
    return `${path}: Invalid date format.`;
  } else if (err.code === "invalid_string") {
    return `${path}: Invalid string format. ${err.validation ? `Validation: ${err.validation}.` : ""}`;
  } else if (err.code === "invalid_intersection_types") {
    return `${path}: Intersection type mismatch.`;
  } else if (err.code === "not_multiple_of") {
    return `${path}: Value must be a multiple of ${err.multipleOf}.`;
  } else if (err.code === "custom") {
    return `${path}: ${err.message || "Custom validation failed."}`;
  } else if (err.code === "invalid_arguments") {
    return `${path}: Invalid function arguments.`;
  } else if (err.code === "invalid_return_type") {
    return `${path}: Invalid function return type.`;
  } else if (err.code === "unrecognized_keys") {
    return `${path}: Unrecognized keys in object: ${err.keys.join(", ")}.`;
  } else if (err.code === "invalid_union" && !isUnionError) {
    return getZodErrorMessages(err.unionErrors[0], true);
  } else {
    return `${path}: Unknown error: ${err.message}`;
  }
};
