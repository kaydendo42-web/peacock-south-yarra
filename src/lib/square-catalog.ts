import type { MenuBoard, MenuItem, MenuSection } from "./menu";

type Money = { amount?: number; currency?: string };
type Presence = {
  is_deleted?: boolean;
  present_at_all_locations?: boolean;
  present_at_location_ids?: string[];
  absent_at_location_ids?: string[];
};
type Variation = Presence & {
  id: string;
  item_variation_data?: {
    name?: string;
    pricing_type?: string;
    price_money?: Money;
    sellable?: boolean;
    ordinal?: number;
    location_overrides?: {
      location_id?: string;
      pricing_type?: string;
      price_money?: Money;
      sold_out?: boolean;
    }[];
  };
};
export type CatalogObject = Presence & {
  id: string;
  type: string;
  category_data?: { name?: string };
  image_data?: { url?: string };
  item_data?: {
    name?: string;
    image_ids?: string[];
    description?: string;
    description_plaintext?: string;
    is_archived?: boolean;
    product_type?: string;
    ecom_visibility?: string;
    category_id?: string;
    categories?: { id: string }[];
    reporting_category?: { id: string };
    variations?: Variation[];
  };
};
type Location = { id: string; status?: string; currency?: string };
export type SquareConfig = {
  token: string;
  environment?: string;
  locationId?: string;
  categoryIds?: string[];
  excludedImageIds?: string[];
};
type CatalogPage = { objects?: CatalogObject[]; cursor?: string };
const DRINKS =
  /coffee|drink|tea\b|matcha|juice|smoothie|cocktail|beer|wine|chai|beverage/i;

export function presentAt(object: Presence, locationId: string) {
  if (object.is_deleted || object.absent_at_location_ids?.includes(locationId))
    return false;
  if (object.present_at_all_locations === true) return true;
  if (object.present_at_location_ids?.includes(locationId)) return true;
  return (
    object.present_at_all_locations !== false &&
    !object.present_at_location_ids?.length
  );
}

export function catalogToMenu(
  objects: CatalogObject[],
  locationId: string,
  categoryIds: string[] = [],
  excludedImageIds: string[] = [],
): MenuBoard[] {
  const images = new Map(
    objects
      .filter(
        (o) =>
          o.type === "IMAGE" &&
          !o.is_deleted &&
          !excludedImageIds.includes(o.id) &&
          o.image_data?.url?.startsWith(
            "https://items-images-production.s3.us-west-2.amazonaws.com/files/",
          ),
      )
      .map((o) => [o.id, o.image_data!.url!]),
  );
  const categories = new Map(
    objects
      .filter((o) => o.type === "CATEGORY" && !o.is_deleted)
      .map((o) => [o.id, o.category_data?.name || "Our menu"]),
  );
  const groups = new Map<string, MenuSection>();
  const seen = new Set<string>();
  for (const object of objects) {
    const item = object.item_data;
    if (
      object.type !== "ITEM" ||
      !item?.name ||
      !presentAt(object, locationId) ||
      item.is_archived ||
      seen.has(object.id)
    )
      continue;
    if (
      item.product_type &&
      !["REGULAR", "FOOD_AND_BEV"].includes(item.product_type)
    )
      continue;
    if (["HIDDEN", "UNAVAILABLE"].includes(item.ecom_visibility || ""))
      continue;
    const ids = [
      ...new Set(
        [
          ...(item.categories || []).map((c) => c.id),
          item.category_id,
          item.reporting_category?.id,
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
    if (categoryIds.length && !ids.some((id) => categoryIds.includes(id)))
      continue;
    const categoryId =
      (categoryIds.length
        ? ids.find((id) => categoryIds.includes(id))
        : ids[0]) || "uncategorised";
    const title = categories.get(categoryId) || "From our kitchen";
    const variations = (item.variations || []).filter(
      (v) =>
        presentAt(v, locationId) && v.item_variation_data?.sellable !== false,
    );
    const rows: MenuItem[] = [];
    for (const variation of variations) {
      const data = variation.item_variation_data;
      if (!data) continue;
      const override = data.location_overrides?.find(
        (o) => o.location_id === locationId,
      );
      if (override?.sold_out) continue;
      const money = override?.price_money ?? data.price_money;
      const pricingType = override?.pricing_type ?? data.pricing_type;
      if (money?.currency && money.currency !== "AUD") continue;
      const fixed =
        pricingType !== "VARIABLE_PRICING" &&
        money?.currency === "AUD" &&
        Number.isSafeInteger(money.amount) &&
        money.amount! >= 0;
      const suffix =
        data.name &&
        !["regular", "default", "standard"].includes(data.name.toLowerCase())
          ? ` — ${data.name}`
          : "";
      rows.push({
        name: item.name + suffix,
        catalogItemId: object.id,
        itemName: item.name,
        variationName: data.name,
        image: item.image_ids?.map((id) => images.get(id)).find(Boolean),
        description: item.description_plaintext || item.description,
        ...(fixed
          ? { price: (money!.amount! / 100).toFixed(2) }
          : { note: "Please ask our team for today’s price." }),
      });
    }
    if (!rows.length) continue;
    seen.add(object.id);
    if (!groups.has(categoryId))
      groups.set(categoryId, { id: `square-${categoryId}`, title, items: [] });
    groups.get(categoryId)!.items.push(...rows);
  }
  const sections = [...groups.values()];
  return [
    {
      id: "all-day",
      title: "All-day food",
      sections: sections.filter((s) => !DRINKS.test(s.title)),
    },
    {
      id: "drinks",
      title: "Drinks",
      sections: sections.filter((s) => DRINKS.test(s.title)),
    },
  ].filter((b) => b.sections.length > 0);
}

export async function readSquareMenu(
  config: SquareConfig,
  request: typeof fetch = fetch,
): Promise<MenuBoard[]> {
  if (!config.token.trim()) throw new Error("Square token is missing.");
  if (
    config.environment &&
    !["production", "sandbox"].includes(config.environment)
  )
    throw new Error("Square environment must be production or sandbox.");
  const host =
    config.environment === "sandbox"
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com";
  async function get<T>(path: string): Promise<T> {
    const response = await request(host + path, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Square-Version": "2026-09-16",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 300 },
    });
    if (!response.ok)
      throw new Error(
        `Square request failed (HTTP ${response.status}). Check token permissions and environment.`,
      );
    const payload = await response.json();
    if (payload.errors?.length)
      throw new Error("Square returned an API error.");
    return payload as T;
  }
  const { locations = [] } = await get<{ locations?: Location[] }>(
    "/v2/locations",
  );
  const active = locations.filter(
    (l) => l.status === "ACTIVE" && l.currency === "AUD",
  );
  const location = config.locationId
    ? active.find((l) => l.id === config.locationId)
    : active.length === 1
      ? active[0]
      : undefined;
  if (!location)
    throw new Error(
      "Set SQUARE_LOCATION_ID to the café’s active AUD location.",
    );
  const objects: CatalogObject[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({ types: "ITEM,CATEGORY,IMAGE" });
    if (cursor) query.set("cursor", cursor);
    const result = await get<CatalogPage>(`/v2/catalog/list?${query}`);
    objects.push(...(result.objects || []));
    cursor = result.cursor;
    if (!cursor) {
      const boards = catalogToMenu(
        objects,
        location.id,
        config.categoryIds,
        config.excludedImageIds,
      );
      if (!boards.length)
        throw new Error(
          "No publishable menu items were found for the selected location and categories.",
        );
      return boards;
    }
    if (cursors.has(cursor))
      throw new Error("Square returned a repeated pagination cursor.");
    cursors.add(cursor);
  }
  throw new Error("Square catalog exceeded the pagination limit.");
}
