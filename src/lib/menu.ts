/**
 * The menu, transcribed from the two menu boards the Wix site published as
 * 842px JPEGs. Keeping it as data means it renders as real text, gets indexed,
 * and can be edited without a trip to a design tool.
 */

export type MenuItem = {
  name: string;
  catalogItemId?: string;
  itemName?: string;
  variationName?: string;
  image?: string;
  /** Omitted for items priced inside `note`, e.g. "10gl / 39btl". */
  price?: string;
  /** Dietary codes as printed on the board: GF/o, V, VG/o, DF, N. */
  tags?: string[];
  description?: string;
  note?: string;
};

/** This catalog photo is a person, not the toastie it is assigned to.
 * Keep it off the website until Jenny replaces/reassigns it in Square. */
export const excludedMenuImageIds = ["3VYN4XC5AC7SVHFSUPL2HC76"];

export type MenuSection = {
  id: string;
  title: string;
  subtitle?: string;
  items: MenuItem[];
};

export type MenuBoard = {
  id: string;
  title: string;
  sections: MenuSection[];
};

export const dietaryLegend = [
  { code: "GF/o", meaning: "gluten free / option" },
  { code: "V/o", meaning: "vegetarian / option" },
  { code: "VG/o", meaning: "vegan / option" },
  { code: "DF/o", meaning: "dairy free / option" },
  { code: "N", meaning: "contains nuts" },
] as const;

export const menuFootnotes = [
  "Sorry, we are unable to split bills on the weekend or during busy periods.",
  "15% surcharge on weekends. 20% surcharge on public holidays.",
] as const;

/**
 * Transcribed from Jenny's current printed menus (All Day Menu + Drinks,
 * September 2026). This is what the website shows: she asked for the food and
 * drinks menu, not every category her Square till uses.
 *
 * Square still carries the older prices on several dishes — see
 * `docs/menu-price-check.md`. When she updates Square, nothing here changes;
 * when she reprints, this file does.
 */
export const foodMenu: MenuBoard = {
  id: "all-day",
  title: "All Day Menu",
  sections: [
    {
      id: "all-day",
      title: "All day",
      items: [
        {
          name: "Toast",
          price: "7.5",
          tags: ["GF/o", "DF/o"],
          description:
            "2 pcs white sourdough or seedy sourdough, with butter. Jam, PB or Vegemite",
        },
        {
          name: "Banana Bread",
          price: "9.5",
          tags: ["V"],
          description: "Housemade banana bread, toasted with butter",
        },
        {
          name: "Carrot Cake",
          price: "9.5",
          tags: ["V", "N"],
          description:
            "Our famous housemade carrot cake served with cream cheese icing and toasted walnuts",
        },
        {
          name: "Toasties",
          price: "13.9",
          note: "GF available on request",
          description:
            "Ham & cheese: ham, cheese, dijon mayo. Reuben: pastrami, cheese, slaw, dijon mayo. Mushroom melt: slow roasted garlic thyme mushrooms, cheese, greens, herb aioli",
        },
        {
          name: "Toasted Croissant",
          price: "8.5",
          description: "Ham & cheese, or tomato & cheese",
        },
        {
          name: "Eggs on Toast",
          price: "15.9",
          tags: ["V", "GF/o", "DF"],
          description:
            "Sourdough toast with eggs your way: poached (2), fried (2) or scrambled (3)",
          note: "Add bacon 7 · add avocado 6",
        },
        {
          name: "Peacock Porridge",
          price: "21.0",
          tags: ["V", "VG/o"],
          description:
            "Creamy banana maple porridge, blueberry compote, strawberries, banana bread crumble",
        },
        {
          name: "Blueberry Honeycomb Hotcakes",
          price: "26.0",
          tags: ["V"],
          description:
            "Our signature baked blueberry hotcakes, blueberry compote, maple syrup, fresh seasonal fruits, honeycomb, double cream",
          note: "Please allow 20 minutes",
        },
        {
          name: "Avocado Toast",
          price: "26.9",
          tags: ["V", "GF/o", "DF/o", "VG/o"],
          description:
            "Avocado, tomato pico, panko crumbed haloumi, housemade chilli jam, whipped dill goat cheese, two poached eggs, sourdough toast",
          note: "Add bacon 7",
        },
        {
          name: "Chilli Scramble",
          price: "24.9",
          tags: ["GF/o", "DF/o"],
          description:
            "Chilli folded eggs, crispy chilli oil, housemade chilli jam, whipped goat cheese, avocado, manchego, seedy sourdough toast",
        },
        {
          name: "Truffle Mushrooms",
          price: "25.9",
          tags: ["V", "GF/o", "DF/o"],
          description:
            "Slow roasted garlic infused mushrooms, folded eggs, manchego, herb aioli, chives, truffle oil, toasted sourdough",
        },
        {
          name: "Brekki Burger",
          price: "17.9",
          tags: ["GF/o", "DF/o"],
          description: "Fried eggs, bacon, cheese, tomato relish, toasted brioche bun",
          note: "Add fries 7",
        },
        {
          name: "Loaded Brekki Burger",
          price: "27.9",
          tags: ["DF/o"],
          description:
            "Fried egg, bacon, cheese, potato rosti, smashed avo, tomato relish, aioli, brioche bun served with fries",
        },
        {
          name: "The Peacock",
          price: "28.9",
          tags: ["GF/o", "DF", "V/o"],
          description:
            "Poached eggs, bacon, avocado, potato rosti, roast garlic thyme mushrooms, seedy sourdough",
          note: "Veg option: panko crumbed haloumi",
        },
        {
          name: "Benedict",
          price: "28.9",
          tags: ["GF/o"],
          description:
            "Two poached eggs, smoked salmon, smashed avocado, potato rosti, toasted croissant, dill hollandaise",
          note: "Not a salmon fan? Swap for bacon",
        },
        {
          name: "Fish Tacos (3)",
          price: "24.9",
          description:
            "Crispy beer battered flathead fillets, avocado, slaw, mango salsa, herb aioli",
          note: "Add fries 7",
        },
        {
          name: "Crispy Chicken Wrap",
          price: "26.0",
          tags: ["DF/o"],
          description:
            "Crispy chicken fillet, bacon, soft leaves, cheese, herb aioli, toasted tortilla, served with fries",
        },
        {
          name: "Falafel Nourish Bowl",
          price: "24.9",
          tags: ["V", "VG/o", "GF", "DF/o"],
          description:
            "Housemade green pea falafels, hummus, mixed grains, slaw salad, tomato pico, tzatziki, roast cauliflower, avocado, vinaigrette",
        },
      ],
    },
    {
      id: "kids",
      title: "Kids",
      items: [
        { name: "Bacon + scrambled egg on toast", price: "12" },
        { name: "Kids hotcake", price: "12", description: "Maple syrup, fruits" },
        { name: "Fish & chips", price: "12" },
        { name: "Chicken schnitzel & chips", price: "12" },
        { name: "Piece of toast with smashed avocado", price: "9" },
        { name: "Cheese toastie", price: "8" },
      ],
    },
    {
      id: "sides",
      title: "Sides",
      items: [
        { name: "Hollandaise", price: "4", note: "each" },
        { name: "Extra poached egg", price: "4", note: "each" },
        { name: "Garlic thyme mushrooms", price: "6", note: "each" },
        { name: "Potato rosti", price: "6", note: "each" },
        { name: "Half avocado", price: "6", note: "each" },
        { name: "Bacon", price: "7", note: "each" },
        { name: "Smoked salmon", price: "7", note: "each" },
        { name: "Panko crumbed haloumi (4 pieces)", price: "7" },
        { name: "Fries with aioli", price: "7" },
        { name: "Gluten free toast substitute", price: "2" },
        { name: "Relish", price: "2" },
      ],
    },
  ],
};

export const drinksMenu: MenuBoard = {
  id: "drinks",
  title: "Drinks",
  sections: [
    {
      id: "coffee",
      title: "Coffee",
      subtitle: "Orthodox by St Ali",
      items: [
        { name: "Espresso / Macchiato", price: "4.0" },
        { name: "Black", price: "5.0" },
        { name: "White", price: "5.0" },
        { name: "Extra shot", price: "+0.5" },
        { name: "Mug", price: "+1.0" },
        { name: "Vanilla / caramel syrup / honey", price: "+0.5" },
        { name: "Ice cream / vanilla cold foam", price: "+1.5" },
        { name: "Bonsoy", price: "+1.0" },
        { name: "Almond milk", price: "+1.2" },
        { name: "Oat milk", price: "+1.2" },
      ],
    },
    {
      id: "matcha",
      title: "Matcha",
      subtitle: "Ceremonial grade (Shizuoka, Japan)",
      items: [
        {
          name: "Matcha Latte",
          price: "6.9",
          description: "Premium ceremonial grade matcha, steamed milk",
        },
        {
          name: "Iced Matcha Latte",
          price: "7.5",
          description: "Premium ceremonial grade matcha, milk, ice",
        },
        {
          name: "Cloud Matcha Latte",
          price: "8.9",
          description:
            "Premium ceremonial grade matcha, milk, vanilla syrup, vanilla cold foam, ice",
        },
        {
          name: "Strawberry Matcha Latte",
          price: "8.9",
          description:
            "Premium ceremonial grade matcha, strawberry compote, milk, ice",
        },
      ],
    },
    {
      id: "something-warm",
      title: "Something warm",
      items: [
        {
          name: "Peacock Chai",
          price: "5.8",
          description: "Housemade sticky chai, steamed milk",
        },
        {
          name: "Peacock Dirty Chai",
          price: "6.3",
          description: "Espresso, housemade sticky chai, steamed milk",
        },
        {
          name: "Hot Chocolate",
          price: "5.5",
          description: "Premium chocolate, steamed milk",
        },
        { name: "Mocha", price: "6.0", description: "Espresso, chocolate, steamed milk" },
      ],
    },
    {
      id: "iced-drinks",
      title: "Iced drinks",
      items: [
        {
          name: "Iced Latte",
          price: "5.8",
          description: "Double espresso, milk, ice",
          note: "Add ice cream 1.5",
        },
        {
          name: "Vanilla Dream",
          price: "7.5",
          description: "Double espresso, oat milk, vanilla syrup, vanilla cold foam, ice",
        },
        {
          name: "Iced Long Black",
          price: "5.3",
          description: "Double espresso, filter water, ice",
        },
        {
          name: "Iced Chocolate",
          price: "7.0",
          description: "Premium chocolate, milk, ice cream, ice",
        },
        {
          name: "Iced Mocha",
          price: "7.5",
          description: "Espresso, chocolate, milk, ice cream, ice",
        },
        {
          name: "Iced Peacock Chai",
          price: "7.5",
          description: "Housemade sticky chai, milk, vanilla cold foam, ice",
        },
      ],
    },
    {
      id: "tea",
      title: "Tea",
      items: [
        {
          name: "Tea",
          price: "5.0",
          description:
            "English breakfast, earl grey, peppermint, chamomile, lemongrass & ginger, China sencha",
        },
      ],
    },
    {
      id: "smoothies",
      title: "Smoothies",
      subtitle: "Made with oat milk",
      items: [
        {
          name: "Rosey Posey",
          price: "14.5",
          description: "Mango, passionfruit, pineapple, strawberry",
        },
        {
          name: "Sunrise",
          price: "14.5",
          description: "Banana, blueberry, strawberry, oats, peanut butter, chia seeds",
        },
        {
          name: "Banana Bliss",
          price: "14.5",
          description: "Banana, greek yogurt, cinnamon, honey, peanut butter, chia seeds",
        },
      ],
    },
    {
      id: "cold-pressed-juice",
      title: "Cold pressed juice",
      items: [
        { name: "Orange", price: "9.9", description: "100% oranges" },
        { name: "Cloudy Apple", price: "9.9", description: "100% apple" },
        {
          name: "The Green",
          price: "9.9",
          description: "Green apple, pear, celery, silverbeet, lemon, ginger",
        },
        {
          name: "Watermelon",
          price: "9.9",
          description: "Watermelon, strawberry, lime, green apple",
        },
      ],
    },
    {
      id: "something-fizzy",
      title: "Something fizzy",
      items: [
        { name: "Coke, Coke Zero, Sprite", price: "5.0" },
        { name: "Lemon Lime Bitters", price: "6.5" },
        { name: "House Sparkling", price: "6.5", note: "Bottomless" },
      ],
    },
    {
      id: "cocktails",
      title: "Cocktails",
      items: [
        { name: "Mimosa", price: "14.5", description: "Prosecco, fresh orange juice" },
        {
          name: "Brekki Banger",
          price: "14.5",
          description: "Vodka, Tabasco, worcestershire, tomato juice, pepper",
        },
        { name: "Aperol Spritz", price: "14.5", description: "Aperol, prosecco, soda" },
        {
          name: "Strawberry Elderflower Spritz",
          price: "14.5",
          description: "Gin, St Germain, strawberry, pineapple, prosecco",
        },
        { name: "Espresso Martini", price: "14.5", description: "Vodka, Kahlua, espresso" },
        { name: "Prosecco", note: "10 glass / 39 bottle" },
        { name: "Peroni Nastro Azzurro", price: "9.0" },
      ],
    },
  ],
};

export const menuSpecials = [
  {
    id: "wednesday-hotcakes",
    title: "$5 Wednesday Hotcakes",
    detail: "$5 per hotcake, Wednesday only. Subject to availability, until sold out.",
  },
  {
    id: "five-dollar-matcha",
    title: "$5 Matcha, Monday to Friday",
    detail: "Excludes public holidays. Alternative milk additional.",
  },
  {
    id: "bottomless-mimosas",
    title: "Bottomless Mimosas",
    detail:
      "$49 per person for a choice of dish and 1.5 hours of mimosas. Available from 10am every day.",
  },
] as const;

export type ResolvedMenu = { boards: MenuBoard[] };

/**
 * The single entry point for both the displayed menu and its JSON-LD.
 *
 * Always the printed menu. The Square reader (`square-catalog.ts`) stays for
 * online ordering, which needs Square's item ids — not for display.
 */
export async function getMenu(): Promise<ResolvedMenu> {
  return { boards: [foodMenu, drinksMenu] };
}
