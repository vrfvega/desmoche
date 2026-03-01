import Phaser from "phaser";
import { Card } from "./Card.ts";

type AddCardOptions = {
  textureKey: string;
  fromX: number;
  fromY: number;
  targetX: number;
  targetY: number;
  delay?: number;
  targetAngle?: number;
  revealOnMoveStart?: boolean;
};

const HAND_BASE_DEPTH = 30;

export class Hand {
  private readonly scene: Phaser.Scene;
  private readonly cardScale: number;
  private readonly cards: Card[] = [];
  private readonly selectedCards = new Set<Card>();
  private readonly basePositions = new Map<
    Card,
    { x: number; y: number; angle: number }
  >();
  private readonly selectedLiftY = 28;
  private readonly maxSelectedCards = 4;
  private readonly onSelectionChanged?: (selectedCount: number) => void;
  private layoutCenterX: number | null = null;
  private layoutWidth: number | null = null;

  constructor(
    scene: Phaser.Scene,
    cardScale: number,
    onSelectionChanged?: (selectedCount: number) => void,
  ) {
    this.scene = scene;
    this.cardScale = cardScale;
    this.onSelectionChanged = onSelectionChanged;
  }

  get size() {
    return this.cards.length;
  }

  setLayoutArea(centerX: number, width: number) {
    this.layoutCenterX = centerX;
    this.layoutWidth = width;
  }

  getBounds(viewportWidth: number, viewportHeight: number) {
    if (this.cards.length === 0) {
      return null;
    }

    const layout = this.getLayoutForCount(
      this.cards.length,
      viewportWidth,
      viewportHeight,
    );
    const cardWidth = this.cards[0]?.sprite.displayWidth ?? 0;
    const cardHeight = this.cards[0]?.sprite.displayHeight ?? 0;

    const left = layout[0].x - cardWidth / 2;
    const right = layout[layout.length - 1].x + cardWidth / 2;
    const minY = Math.min(...layout.map((item) => item.y));
    const maxY = Math.max(...layout.map((item) => item.y));
    const top = minY - cardHeight / 2;
    const bottom = maxY + cardHeight / 2;

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  getCardPosition(index: number) {
    const card = this.cards[index];
    if (!card) {
      return null;
    }

    return {
      x: card.sprite.x,
      y: card.sprite.y,
    };
  }

  getLayoutForCount(
    cardCount: number,
    viewportWidth: number,
    viewportHeight: number,
    referenceHeight = this.cards[0]?.sprite.displayHeight ?? 220,
  ) {
    const effectiveWidth = this.layoutWidth ?? viewportWidth;
    const centerX = this.layoutCenterX ?? viewportWidth / 2;
    const spacing = Math.min(88, effectiveWidth * 0.105);
    const totalSpread = (cardCount - 1) * spacing;
    const startX = centerX - totalSpread / 2;
    const rowY = viewportHeight - Math.max(referenceHeight * 0.42, 112);
    const midpoint = (cardCount - 1) / 2;

    return Array.from({ length: cardCount }, (_, index) => {
      const distanceFromCenter = Math.abs(index - midpoint);
      const normalizedDistance =
        midpoint === 0 ? 0 : distanceFromCenter / midpoint;

      return {
        x: startX + index * spacing,
        y: rowY + normalizedDistance * 4,
        angle: (index - midpoint) * 0.85,
      };
    });
  }

  addCard({
    textureKey,
    fromX,
    fromY,
    targetX,
    targetY,
    delay = 0,
    targetAngle = 0,
    revealOnMoveStart = true,
  }: AddCardOptions) {
    const card = new Card(
      this.scene,
      textureKey,
      fromX,
      fromY,
      this.cardScale,
      HAND_BASE_DEPTH + this.cards.length,
    );

    this.cards.push(card);
    this.updateCardDepths();
    this.basePositions.set(card, {
      x: targetX,
      y: targetY,
      angle: targetAngle,
    });

    card.sprite.setVisible(!revealOnMoveStart);

    const travelTilt = Phaser.Math.Clamp((targetX - fromX) * 0.03, -18, 18);
    card.sprite.setAngle(travelTilt);

    card.sprite.on("pointerdown", () => {
      this.toggleSelection(card);
    });

    card.moveTo({
      x: targetX,
      y: targetY,
      angle: targetAngle,
      delay,
      duration: 520,
      ease: "Back.out",
      onStart: () => {
        if (revealOnMoveStart) {
          card.sprite.setVisible(true);
        }
      },
    });
  }

  relayout(viewportWidth: number, viewportHeight: number, duration = 220) {
    const layout = this.getLayoutForCount(
      this.cards.length,
      viewportWidth,
      viewportHeight,
    );

    this.cards.forEach((card, index) => {
      card.sprite.setDepth(HAND_BASE_DEPTH + index);
      this.basePositions.set(card, {
        x: layout[index].x,
        y: layout[index].y,
        angle: layout[index].angle,
      });

      const target = this.getRenderTarget(card);
      card.moveTo({
        x: target.x,
        y: target.y,
        angle: target.angle,
        duration,
        ease: "Sine.out",
      });
    });
  }

  popSelectedCards() {
    const selected = [...this.selectedCards];
    if (selected.length === 0) {
      return selected;
    }

    this.cards.splice(
      0,
      this.cards.length,
      ...this.cards.filter((card) => !this.selectedCards.has(card)),
    );

    selected.forEach((card) => {
      this.selectedCards.delete(card);
      this.basePositions.delete(card);
    });

    this.updateCardDepths();
    this.notifySelectionChanged();
    return selected;
  }

  private toggleSelection(card: Card) {
    if (this.selectedCards.has(card)) {
      this.selectedCards.delete(card);
    } else {
      if (this.selectedCards.size >= this.maxSelectedCards) {
        return;
      }

      this.selectedCards.add(card);
    }

    const target = this.getRenderTarget(card);
    card.moveTo({
      x: target.x,
      y: target.y,
      angle: target.angle,
      duration: 140,
      ease: "Sine.out",
    });

    this.notifySelectionChanged();
  }

  private getRenderTarget(card: Card) {
    const base = this.basePositions.get(card);
    if (!base) {
      return { x: card.sprite.x, y: card.sprite.y, angle: card.sprite.angle };
    }

    if (!this.selectedCards.has(card)) {
      return base;
    }

    return {
      x: base.x,
      y: base.y - this.selectedLiftY,
      angle: base.angle,
    };
  }

  private notifySelectionChanged() {
    this.onSelectionChanged?.(this.selectedCards.size);
  }

  private updateCardDepths() {
    this.cards.forEach((card, index) => {
      card.sprite.setDepth(HAND_BASE_DEPTH + index);
    });
  }
}
