import Phaser from "phaser";
import { Deck } from "./Deck";
import { Hand } from "./Hand";
import { CARD_SCALE } from "./constants";

export class DemoScene extends Phaser.Scene {
  private hand: Hand | null = null;
  private deck: Deck | null = null;

  constructor() {
    super("demo");
  }

  preload() {
    Deck.preload(this);
  }

  create() {
    this.hand = new Hand(this, CARD_SCALE);
    this.deck = new Deck(this, this.hand, CARD_SCALE);
    this.deck.dealOpeningHand(9);

    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      this.deck?.resize(gameSize.width, gameSize.height);
    });
  }
}
