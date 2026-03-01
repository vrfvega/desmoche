import Phaser from "phaser";
import { Card } from "./Card.ts";
import { DECK_BACK_KEY, UI_FONT_FAMILY } from "./constants";

export class DiscardPile {
  private readonly scene: Phaser.Scene;
  private centerX: number;
  private centerY: number;
  private readonly slot: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly cards: Card[] = [];
  private readonly labelOffsetY: number;

  constructor(
    scene: Phaser.Scene,
    centerX: number,
    centerY: number,
    cardScale: number,
  ) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerY = centerY;

    const deckFrame = this.scene.textures.getFrame(DECK_BACK_KEY);
    const frameWidth = deckFrame?.width ?? 71;
    const frameHeight = deckFrame?.height ?? 96;
    const pileScale = Math.min(cardScale * 1.15, 3);
    const slotWidth = frameWidth * pileScale;
    const slotHeight = frameHeight * pileScale;
    this.labelOffsetY = slotHeight / 2 + 22;

    this.slot = this.scene.add
      .rectangle(this.centerX, this.centerY, slotWidth, slotHeight)
      .setStrokeStyle(2, 0x94a3b8, 0.35)
      .setFillStyle(0x0b1220, 0.22)
      .setDepth(5);

    this.label = this.scene.add
      .text(this.centerX, this.centerY + this.labelOffsetY, "Discard", {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "16px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  setPosition(centerX: number, centerY: number) {
    this.centerX = centerX;
    this.centerY = centerY;

    this.slot.setPosition(this.centerX, this.centerY);
    this.label.setPosition(this.centerX, this.centerY + this.labelOffsetY);
  }

  addCards(cards: Card[]) {
    cards.forEach((card, index) => {
      this.cards.push(card);
      card.sprite.disableInteractive();

      const pileIndex = this.cards.length - 1;
      const targetAngle = Phaser.Math.Clamp(
        Phaser.Math.FloatBetween(-9, 9) + (pileIndex % 2 === 0 ? -1.2 : 1.2),
        -12,
        12,
      );

      card.moveTo({
        x: this.centerX,
        y: this.centerY,
        angle: targetAngle,
        delay: index * 50,
        duration: 240,
        ease: "Sine.out",
      });

      card.sprite.setDepth(70 + pileIndex);
    });
  }
}
