import Phaser from "phaser";
import { PlayingCard } from "./PlayingCard";

export class Hand {
  private readonly scene: Phaser.Scene;
  private readonly cardScale: number;
  private readonly cards: PlayingCard[] = [];

  constructor(scene: Phaser.Scene, cardScale: number) {
    this.scene = scene;
    this.cardScale = cardScale;
  }

  get size() {
    return this.cards.length;
  }

  getLayoutForCount(
    cardCount: number,
    viewportWidth: number,
    viewportHeight: number,
    referenceHeight = this.cards[0]?.sprite.displayHeight ?? 220,
  ) {
    const spacing = Math.min(92, viewportWidth * 0.075);
    const totalSpread = (cardCount - 1) * spacing;
    const startX = viewportWidth / 2 - totalSpread / 2;
    const rowY = viewportHeight - Math.max(referenceHeight * 0.42, 112);

    return Array.from({ length: cardCount }, (_, index) => ({
      x: startX + index * spacing,
      y: rowY,
    }));
  }

  addCard(
    textureKey: string,
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    delay: number,
  ) {
    const card = new PlayingCard(
      this.scene,
      textureKey,
      fromX,
      fromY,
      this.cardScale,
      30 + this.cards.length,
    );

    this.cards.push(card);

    card.moveTo({
      x: targetX,
      y: targetY,
      angle: 0,
      delay,
      duration: 460,
      ease: "Cubic.out",
    });
  }

  relayout(viewportWidth: number, viewportHeight: number, duration = 220) {
    const layout = this.getLayoutForCount(
      this.cards.length,
      viewportWidth,
      viewportHeight,
    );

    this.cards.forEach((card, index) => {
      card.moveTo({
        x: layout[index].x,
        y: layout[index].y,
        angle: 0,
        duration,
        ease: "Sine.out",
      });
    });
  }
}
