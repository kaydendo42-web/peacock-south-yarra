import "server-only";
import { cache } from "react";
import { readSquareMenu } from "./square-catalog";
import { excludedMenuImageIds } from "./menu";

export const getSquareMenu = cache(async () =>
  readSquareMenu({
    token: process.env.SQUARE_ACCESS_TOKEN || "",
    excludedImageIds: excludedMenuImageIds,
    environment: process.env.SQUARE_ENVIRONMENT || "production",
    locationId: process.env.SQUARE_LOCATION_ID?.trim() || undefined,
    categoryIds: process.env.SQUARE_MENU_CATEGORY_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  }),
);
