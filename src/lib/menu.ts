/**
 * The menu, transcribed from the two menu boards the Wix site published as
 * 842px JPEGs. Keeping it as data means it renders as real text, gets indexed,
 * and can be edited without a trip to a design tool.
 */

export type MenuItem = {
  name: string;
  /** Omitted for items priced inside `note`, e.g. "10gl / 39btl". */
  price?: string;
  /** Dietary codes as printed on the board: GF/o, V, VG/o, DF, N. */
  tags?: string[];
  description?: string;
  note?: string;
};

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
  "10% surcharge on weekends. 15% surcharge on public holidays.",
] as const;

export const foodMenu: MenuBoard = {
  id: "all-day",
  title: "All Day Menu",
  sections: [
    {
      id: "toast-and-bakery",
      title: "Toast & Bakery",
      items: [
        {
          name: "Toast",
          price: "7.5",
          tags: ["GF/o", "DF/o"],
          description:
            "2 pcs white sourdough or seedy sourdough, with butter — jam, peanut butter or Vegemite",
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
          name: "Toasted Croissant",
          price: "8.5",
          description: "Ham & cheese, or tomato & cheese",
        },
        {
          name: "Toasties",
          price: "12.9",
          note: "GF available on request",
          description:
            "Ham & cheese — ham, cheese, dijon mayo. Reuben — pastrami, cheese, slaw, dijon mayo. Mushroom melt — slow roasted garlic thyme mushrooms, cheese, rocket, herb aioli",
        },
      ],
    },
    {
      id: "breakfast",
      title: "Breakfast",
      items: [
        {
          name: "Eggs on Toast",
          price: "14.9",
          tags: ["V", "GF/o", "DF"],
          description:
            "Sourdough toast with eggs your way — poached (2), fried (2) or scrambled (3)",
          note: "Add bacon 7 · add avocado 7",
        },
        {
          name: "Peacock Porridge",
          price: "19.9",
          tags: ["V", "VG/o"],
          description:
            "Creamy banana maple porridge, blueberry compote, strawberries, banana bread crumble",
        },
        {
          name: "Blueberry Honeycomb Hotcakes",
          price: "25.9",
          tags: ["V"],
          description:
            "Our signature baked blueberry hotcakes, blueberry compote, maple syrup, fresh seasonal fruits, honeycomb, double cream",
          note: "Please allow 20 minutes",
        },
        {
          name: "Avocado Toast",
          price: "25.0",
          tags: ["V", "GF/o", "DF/o", "VG/o"],
          description:
            "Avocado, pico de gallo, panko crumbed halloumi, goat cheese, housemade chilli jam, poached egg, sourdough toast",
          note: "Add bacon 7",
        },
        {
          name: "Chilli Crab Scramble",
          price: "27.9",
          tags: ["GF/o", "DF/o"],
          description:
            "Folded eggs, spanner crab, crispy chilli oil, housemade chilli jam, avocado, manchego, seedy sourdough toast",
        },
        {
          name: "The Peacock",
          price: "27.9",
          tags: ["GF/o", "DF", "V/o"],
          description:
            "Two poached eggs, bacon, avocado, potato rosti, slow roasted garlic thyme mushrooms, seedy sourdough",
          note: "Veg option — panko crumbed halloumi",
        },
        {
          name: "Benedict",
          price: "27.9",
          tags: ["GF/o"],
          description:
            "Crispy bacon, smashed avocado, poached eggs, potato rosti, hollandaise, crispy shallots, on seedy sourdough",
        },
        {
          name: "Truffle Mushrooms",
          price: "24.9",
          tags: ["V", "GF/o", "DF/o"],
          description:
            "Slow roasted garlic infused mushrooms, folded eggs, manchego, herb aioli, chives, toasted sourdough, truffle oil",
        },
      ],
    },
    {
      id: "burgers-and-lunch",
      title: "Burgers & Lunch",
      items: [
        {
          name: "Brekki Burger",
          price: "16.9",
          tags: ["GF/o", "DF/o"],
          description: "Fried eggs, bacon, cheese, tomato sauce, toasted brioche bun",
          note: "Add fries 7",
        },
        {
          name: "Loaded Brekki Burger",
          price: "27.9",
          tags: ["DF/o"],
          description:
            "Fried eggs, bacon, potato rosti, cheese, smashed avo, tomato sauce, aioli, brioche bun served with fries",
        },
        {
          name: "Fish Tacos (3)",
          price: "24.9",
          description:
            "Crispy beer battered flathead fillets, crisp cabbage slaw, pico de gallo, herb aioli",
          note: "Add fries 7",
        },
        {
          name: "Crispy Chicken Wrap",
          price: "25.0",
          tags: ["DF/o"],
          description:
            "Crispy chicken fillet, bacon, soft leaves, cheese, herb aioli, toasted tortilla, served with fries",
        },
        {
          name: "Falafel Nourish Bowl",
          price: "24.9",
          tags: ["V", "VG/o", "GF", "DF/o"],
          description:
            "Housemade green pea falafels, tzatziki, mixed grains, slaw salad, roast cauliflower, avocado, vinaigrette",
        },
      ],
    },
    {
      id: "kids",
      title: "Kids",
      items: [
        { name: "Bacon + scrambled egg on toast", price: "12" },
        { name: "Kids hotcake — maple syrup, fruits", price: "12" },
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
        { name: "Hollandaise · Extra poached egg", price: "4ea" },
        { name: "Garlic thyme mushrooms · Potato rosti", price: "6ea" },
        { name: "Half avocado · Bacon", price: "7ea" },
        { name: "Panko crumbed halloumi (3 pieces)", price: "8ea" },
        { name: "Fries with aioli", price: "7ea" },
        { name: "Gluten free toast substitute · Extra sauces", price: "1ea" },
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
        { name: "Black · White", price: "5.0" },
        { name: "Extra shot coffee", price: "+0.5" },
        { name: "Decaf", price: "+0.5" },
        { name: "Mug", price: "+1.2" },
        { name: "Vanilla, caramel syrup or honey", price: "+0.5" },
        { name: "Ice cream · Vanilla cold foam", price: "+1.0" },
        { name: "Bonsoy · Almond milk · Oat milk", price: "+1.0" },
      ],
    },
    {
      id: "something-warm",
      title: "Something Warm",
      items: [
        { name: "Peacock Chai", price: "7.2", description: "Housemade sticky chai, steamed milk" },
        {
          name: "Peacock Dirty Chai",
          price: "7.7",
          description: "Espresso, housemade sticky chai, steamed milk",
        },
        { name: "Hot Chocolate", price: "5.5", description: "Premium chocolate, steamed milk" },
        { name: "Mocha", price: "6.0", description: "Espresso, chocolate, steamed milk" },
      ],
    },
    {
      id: "tea",
      title: "Tea",
      subtitle: "5.0",
      items: [
        { name: "English Breakfast · Earl Grey" },
        { name: "Peppermint · Chamomile" },
        { name: "Lemongrass & Ginger · China Sencha" },
      ],
    },
    {
      id: "matcha",
      title: "Matcha",
      subtitle: "Ceremonial grade, Shizuoka, Japan",
      items: [
        {
          name: "Matcha Latte",
          price: "7.9",
          description: "Premium ceremonial grade matcha, steamed milk",
        },
        {
          name: "Iced Matcha Latte",
          price: "8.5",
          description: "Premium ceremonial grade matcha, milk, ice",
          note: "Add vanilla cold foam 1.0 (contains dairy)",
        },
        {
          name: "Coconut Cloud Matcha Latte",
          price: "9.5",
          description: "Premium ceremonial grade matcha cloud, coconut water, ice",
          note: "Contains dairy",
        },
        {
          name: "Strawberry Matcha Latte",
          price: "9.5",
          description: "Premium ceremonial grade matcha, strawberry compote, milk, ice",
        },
      ],
    },
    {
      id: "iced-drinks",
      title: "Iced Drinks",
      items: [
        {
          name: "Iced Latte",
          price: "5.8",
          description: "Double espresso, milk, ice",
          note: "Add ice cream 1.0",
        },
        { name: "Iced Long Black", price: "5.3", description: "Double espresso, filter water, ice" },
        { name: "Cold Brew", price: "5.3", description: "Orthodox cold brew, filter water, ice" },
        {
          name: "Cloud Cold Brew",
          price: "6.3",
          description: "Orthodox cold brew, vanilla cold foam, zest, filter water, ice",
          note: "Contains dairy",
        },
        {
          name: "Iced Chocolate",
          price: "6.5",
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
          note: "Contains dairy",
        },
      ],
    },
    {
      id: "something-fizzy",
      title: "Something Fizzy",
      items: [
        { name: "Coke · Coke Zero · Sprite", price: "5.0" },
        { name: "Lemon Lime Bitters", price: "6.5" },
        { name: "House Sparkling — bottomless", price: "6.5" },
      ],
    },
    {
      id: "smoothies",
      title: "Smoothies",
      subtitle: "14.5 — made with oat milk",
      items: [
        { name: "Rosey Posey", description: "Mango, passionfruit, pineapple, strawberry" },
        {
          name: "Sunrise",
          description: "Banana, blueberry, strawberry, oats, peanut butter, chia seeds",
        },
        {
          name: "Banana Bliss",
          description: "Banana, greek yoghurt, cinnamon, honey, peanut butter, chia seeds",
        },
        { name: "Green Glow", description: "Kale, banana, avocado, mango, pineapple, coconut water" },
      ],
    },
    {
      id: "cold-pressed-juice",
      title: "Cold Pressed Juice",
      subtitle: "9.9",
      items: [
        { name: "Orange", description: "100% oranges" },
        { name: "Cloudy Apple", description: "100% apple" },
        { name: "The Green", description: "Green apple, pear, celery, silverbeet, lemon, ginger" },
        { name: "Watermelon", description: "Watermelon, strawberry, lime, green apple" },
      ],
    },
    {
      id: "cocktails",
      title: "Cocktails",
      subtitle: "12.5",
      items: [
        { name: "Mimosa", description: "Prosecco, fresh orange juice" },
        {
          name: "Brekki Banger",
          description: "Vodka, Tabasco, worcestershire, tomato juice, pepper",
        },
        { name: "Aperol Spritz", description: "Aperol, prosecco, soda" },
        {
          name: "Strawberry Elderflower Spritz",
          description: "Gin, St Germain, strawberry, pineapple, prosecco",
        },
        { name: "Espresso Martini", description: "Vodka, Kahlua, espresso" },
        { name: "Prosecco", note: "10 glass / 39 bottle" },
        { name: "Peroni Nastro Azzurro", price: "9.0" },
      ],
    },
  ],
};

export const menuSpecials = [
  {
    id: "hump-day",
    title: "$5 Hump Day Hotcakes",
    detail: "$5 per hotcake, available Wednesday only.",
  },
  {
    id: "j5-matcha",
    title: "J5 Matcha, Monday to Friday",
    detail: "Excludes public holidays. Alternative milk additional.",
  },
  {
    id: "bottomless-mimosas",
    title: "Bottomless Mimosas",
    detail:
      "$49 per person for a choice of dish and 1.5 hours of mimosas. Available from 10am every day.",
  },
] as const;
