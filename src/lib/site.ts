/** Single source of truth for NAP, hours and navigation. */

export const site = {
  name: "The Peacock South Yarra",
  shortName: "The Peacock",
  url: "https://www.thepeacock.com.au",
  strapline: "South Yarra's best brunch cafe",
  street: "68 River Street",
  suburb: "South Yarra",
  state: "VIC",
  postcode: "3141",
  country: "AU",
  /** Display form used in the footer, matching the live site. */
  addressLine: "68 RIVER STREET, SOUTH YARRA, VIC, 3141",
  phone: "03 8596 2342",
  phoneHref: "tel:+61385962342",
  phoneRaw: "+61385962342",
  email: "hello@thepeacock.com.au",
  instagram: "https://www.instagram.com/thepeacock_southyarra/",
  instagramHandle: "thepeacock_southyarra",
  facebook: "https://www.facebook.com/thepeacocksouthyarra/",
  googleReview: "https://g.page/r/thepeacocksouthyarra/review",
  googleMapsQuery: "68+River+Street,+South+Yarra+VIC+3141",
  /** Melbourne CBD-adjacent; used for LocalBusiness geo. */
  geo: { lat: -37.8398, lng: 144.9938 },
  priceRange: "$$",
} as const;

export const hours = {
  weekdays: { label: "MONDAY - FRIDAY", open: "07:00", close: "15:00", display: "7am - 3pm" },
  weekend: { label: "SATURDAY - SUNDAY", open: "08:00", close: "15:00", display: "8am - 3pm" },
  publicHolidays: { label: "PUBLIC HOLIDAYS", display: "8am - 3pm" },
} as const;

export const nav = [
  { href: "/", label: "HOME" },
  { href: "/cafe-menu", label: "CAFE MENU" },
  { href: "/menu", label: "MENU" },
  { href: "/book-a-table", label: "BOOKINGS" },
  { href: "/contact-us", label: "CONTACT" },
] as const;
