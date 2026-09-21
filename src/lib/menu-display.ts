import type { MenuItem } from "./menu";

export function groupMenuItems(items: MenuItem[]) {
  const groups = new Map<
    string,
    {
      name: string;
      image?: string;
      description?: string;
      variations: MenuItem[];
    }
  >();
  items.forEach((item, index) => {
    const key = item.catalogItemId || `local-${index}`;
    const group = groups.get(key);
    if (group) group.variations.push(item);
    else
      groups.set(key, {
        name: item.itemName || item.name,
        image: item.image,
        description: item.description,
        variations: [item],
      });
  });
  return [...groups.values()];
}
