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
  private readonly drawPile = Phaser.Utils.Array.Shuffle([...CARD_TEXTURES]);
  private deckWidth = 0;
  private deckCardWidth = 0;
  private deckCardHeight = 0;
  private hideDeckTimer: Phaser.Time.TimerEvent | null = null;
  private readonly deckSlidePadding = 48;

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
    const drawnCards = this.drawCards(cardCount);
    if (drawnCards.length === 0) {
      return;
    }

    this.showDeckTemporarily();

    const { x: fromX, y: fromY } = this.getDrawOrigin(
      this.scene.scale.width,
      this.scene.scale.height,
    );
    const handLayout = this.hand.getLayoutForCount(
      drawnCards.length,
      this.scene.scale.width,
      this.scene.scale.height,
      this.deckCardHeight,
    );

    drawnCards.forEach((card, index) => {
      this.hand.addCard({
        textureKey: card.key,
        fromX,
        fromY,
        targetX: handLayout[index].x,
        targetY: handLayout[index].y,
        delay: index * 75,
      });
    });
  }

  drawToHand(cardCount = 1) {
    const drawnCards = this.drawCards(cardCount);
    if (drawnCards.length === 0) {
      return 0;
    }

    this.showDeckTemporarily();

    const viewportWidth = this.scene.scale.width;
    const viewportHeight = this.scene.scale.height;
    const { x: fromX, y: fromY } = this.getDrawOrigin(
      viewportWidth,
      viewportHeight,
    );
    const finalHandCount = this.hand.size + drawnCards.length;
    const handLayout = this.hand.getLayoutForCount(
      finalHandCount,
      viewportWidth,
      viewportHeight,
      this.deckCardHeight,
    );

    drawnCards.forEach((card, index) => {
      const targetIndex = finalHandCount - drawnCards.length + index;
      this.hand.addCard({
        textureKey: card.key,
        fromX,
        fromY,
        targetX: handLayout[targetIndex].x,
        targetY: handLayout[targetIndex].y,
        delay: index * 75,
        revealOnMoveStart: false,
      });
    });

    this.hand.relayout(viewportWidth, viewportHeight, 220);
    return drawnCards.length;
  }

  resize(viewportWidth: number, viewportHeight: number) {
    if (!this.container) {
      return;
    }

    const targetX = this.getDeckOriginX(viewportWidth);
    const targetY = this.getDeckOriginY(viewportHeight);

    if (!this.container.visible) {
      this.container.setPosition(this.getHiddenDeckX(), targetY);
      return;
    }

    const isOffscreenLeft = this.container.x < targetX - 8;
    this.container.setPosition(
      isOffscreenLeft ? this.getHiddenDeckX() : targetX,
      targetY,
    );
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
        align: "right",
      })
      .setOrigin(1, 0)
      .setShadow(0, 2, "#000000", 6, true, true);

    this.deckCardWidth = stack[2].displayWidth;
    this.deckCardHeight = stack[2].displayHeight;
    this.deckWidth = this.deckCardWidth + 12;
    this.counterText.setX(this.deckWidth);

    this.container = this.scene.add.container(
      this.getDeckOriginX(this.scene.scale.width),
      this.getDeckOriginY(this.scene.scale.height),
      [...stack, this.counterText],
    );
    this.container.setDepth(200);
    this.container.setVisible(false);
    this.container.setX(this.getHiddenDeckX());
  }

  private updateCounter() {
    this.counterText?.setText(`${this.remainingCards}/${TOTAL_CARDS}`);
  }

  private drawCards(cardCount: number) {
    const drawnCards = this.drawPile.splice(0, cardCount);
    this.remainingCards = this.drawPile.length;
    this.updateCounter();
    return drawnCards;
  }

  private getDrawOrigin(viewportWidth: number, viewportHeight: number) {
    return {
      x: this.getDeckOriginX(viewportWidth) + 12 + this.deckCardWidth / 2,
      y: this.getDeckOriginY(viewportHeight) - 12 - this.deckCardHeight / 2,
    };
  }

  private showDeckTemporarily() {
    if (!this.container) {
      return;
    }

    const targetX = this.getDeckOriginX(this.scene.scale.width);
    const targetY = this.getDeckOriginY(this.scene.scale.height);

    this.scene.tweens.killTweensOf(this.container);
    this.container.setVisible(true).setPosition(this.getHiddenDeckX(), targetY);

    this.scene.tweens.add({
      targets: this.container,
      x: targetX,
      duration: 260,
      ease: "Cubic.out",
    });

    if (this.hideDeckTimer) {
      this.hideDeckTimer.remove(false);
      this.hideDeckTimer = null;
    }

    this.hideDeckTimer = this.scene.time.delayedCall(3000, () => {
      if (!this.container) {
        this.hideDeckTimer = null;
        return;
      }

      this.scene.tweens.killTweensOf(this.container);
      this.scene.tweens.add({
        targets: this.container,
        x: this.getHiddenDeckX(),
        duration: 240,
        ease: "Cubic.in",
        onComplete: () => {
          this.container?.setVisible(false);
        },
      });
      this.hideDeckTimer = null;
    });
  }

  private getHiddenDeckX() {
    return this.scene.scale.width + this.deckSlidePadding;
  }

  private getDeckOriginX(viewportWidth: number) {
    return viewportWidth - this.deckWidth - this.marginX;
  }

  private getDeckOriginY(viewportHeight: number) {
    return viewportHeight - this.marginY;
  }
}
