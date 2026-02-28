import Phaser from "phaser";
import { Hand } from "./Hand";
import {
  CARD_TEXTURES,
  DECK_BACK_KEY,
  DECK_BACK_PATH,
  TOTAL_CARDS,
} from "./constants";

export class Deck {
  private readonly scene: Phaser.Scene;
  private readonly hand: Hand;
  private readonly cardScale: number;
  private readonly marginX: number;
  private readonly marginY: number;

  private container: Phaser.GameObjects.Container | null = null;
  private counterText: Phaser.GameObjects.Text | null = null;
  private remainingCards = TOTAL_CARDS;
  private deckWidth = 0;
  private deckCardWidth = 0;
  private deckCardHeight = 0;

  constructor(
    scene: Phaser.Scene,
    hand: Hand,
    cardScale: number,
    marginX = 36,
    marginY = 36,
  ) {
    this.scene = scene;
    this.hand = hand;
    this.cardScale = cardScale;
    this.marginX = marginX;
    this.marginY = marginY;

    this.createVisual();
  }

  static preload(scene: Phaser.Scene) {
    scene.load.image(DECK_BACK_KEY, DECK_BACK_PATH);

    for (const card of CARD_TEXTURES) {
      scene.load.image(card.key, card.path);
    }
  }

  dealOpeningHand(cardCount: number) {
    const drawnCards = Phaser.Utils.Array.Shuffle([...CARD_TEXTURES]).slice(
      0,
      cardCount,
    );
    this.remainingCards = Math.max(TOTAL_CARDS - drawnCards.length, 0);
    this.updateCounter();

    const fromX =
      this.getDeckOriginX(this.scene.scale.width) + 12 + this.deckCardWidth / 2;
    const fromY =
      this.getDeckOriginY(this.scene.scale.height) -
      12 -
      this.deckCardHeight / 2;
    const handLayout = this.hand.getLayoutForCount(
      drawnCards.length,
      this.scene.scale.width,
      this.scene.scale.height,
      this.deckCardHeight,
    );

    drawnCards.forEach((card, index) => {
      this.hand.addCard(
        card.key,
        fromX,
        fromY,
        handLayout[index].x,
        handLayout[index].y,
        index * 75,
      );
    });
  }

  resize(viewportWidth: number, viewportHeight: number) {
    this.container?.setPosition(
      this.getDeckOriginX(viewportWidth),
      this.getDeckOriginY(viewportHeight),
    );

    this.hand.relayout(viewportWidth, viewportHeight);
  }

  private createVisual() {
    const stack = [
      this.scene.add
        .image(0, 0, DECK_BACK_KEY)
        .setOrigin(0, 1)
        .setScale(this.cardScale)
        .setAlpha(0.55),
      this.scene.add
        .image(6, -6, DECK_BACK_KEY)
        .setOrigin(0, 1)
        .setScale(this.cardScale)
        .setAlpha(0.75),
      this.scene.add
        .image(12, -12, DECK_BACK_KEY)
        .setOrigin(0, 1)
        .setScale(this.cardScale)
        .setAlpha(1),
    ];

    this.counterText = this.scene.add
      .text(0, 8, `${this.remainingCards}/${TOTAL_CARDS}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#f8fafc",
        align: "left",
      })
      .setShadow(0, 2, "#000000", 6, true, true);

    this.deckCardWidth = stack[2].displayWidth;
    this.deckCardHeight = stack[2].displayHeight;
    this.deckWidth = this.deckCardWidth + 12;

    this.container = this.scene.add.container(
      this.getDeckOriginX(this.scene.scale.width),
      this.getDeckOriginY(this.scene.scale.height),
      [...stack, this.counterText],
    );
    this.container.setDepth(200);
  }

  private updateCounter() {
    this.counterText?.setText(`${this.remainingCards}/${TOTAL_CARDS}`);
  }

  private getDeckOriginX(viewportWidth: number) {
    return viewportWidth - this.deckWidth - this.marginX;
  }

  private getDeckOriginY(viewportHeight: number) {
    return viewportHeight - this.marginY;
  }
}
