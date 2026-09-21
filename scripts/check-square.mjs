import nextEnv from "@next/env";
import { readSquareMenu } from "../src/lib/square-catalog.ts";
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.SQUARE_ACCESS_TOKEN?.trim()) {
  console.log(
    "Square is not connected. Add SQUARE_ACCESS_TOKEN to .env.local, then run npm run square:check.",
  );
  process.exitCode = 1;
} else {
  try {
    const boards = await readSquareMenu({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT || "production",
      locationId: process.env.SQUARE_LOCATION_ID?.trim(),
      categoryIds: process.env.SQUARE_MENU_CATEGORY_IDS?.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    const sections = boards.flatMap((b) => b.sections);
    console.log(
      `Square connected: ${sections.length} categories, ${sections.reduce((n, s) => n + s.items.length, 0)} menu variations. Prices in AUD.`,
    );
    for (const section of sections)
      console.log(
        `${section.id.replace(/^square-/, "")}: ${section.title} (${section.items.length} items)`,
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
