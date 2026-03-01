export const SUITS = ["Hearts", "Spades", "Diamonds", "Clubs"];
export const RANKS = [
  "ACE",
  "K",
  "Q",
  "J",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];

export const CARD_SCALE = 3;
export const TOTAL_CARDS = 52;
export const UI_FONT_FAMILY = '"Minecraft", monospace';

export const DECK_BACK_KEY = "card-back";
export const DECK_BACK_PATH = "/Back_1.png";

export const CARD_TEXTURES = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({
    key: `${suit.toLowerCase()}-${rank.toLowerCase()}`,
    path: `/${suit}_${rank}.png`,
  })),
);
