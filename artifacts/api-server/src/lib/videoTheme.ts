import { z } from "zod";

export const VIDEO_THEME_MAX_LENGTH = 48;
export const RESERVED_VIDEO_THEME = "Todos";

export const videoThemeSchema = z
  .string()
  .transform((value) => value.trim().normalize("NFC").replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1, "La etiqueta temática no puede estar vacía")
      .max(
        VIDEO_THEME_MAX_LENGTH,
        `La etiqueta temática no puede superar ${VIDEO_THEME_MAX_LENGTH} caracteres`,
      ),
  )
  .refine(
    (value) =>
      value.toLocaleLowerCase("es") !==
      RESERVED_VIDEO_THEME.toLocaleLowerCase("es"),
    `“${RESERVED_VIDEO_THEME}” está reservado para mostrar todos los videos`,
  );

export const optionalVideoThemeSchema = z
  .union([videoThemeSchema, z.null()])
  .optional();