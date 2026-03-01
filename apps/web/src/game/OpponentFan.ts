import Phaser from "phaser";
import { Card } from "./Card.ts";
import { DECK_BACK_KEY } from "./constants";

type OpponentFanConfig = {
  cardScale?: number;
  spreadDegrees?: number;
  orbitPadding?: number;
  depth?: number;
};

const SPAWN_OFFSET_RATIO = 0.36;

const DEFAULT_CONFIG: Required<OpponentFanConfig> = {
  cardScale: 2,
  spreadDegrees: 84,
  orbitPadding: 10,
  depth: 120,
};

export class OpponentFan {
  private readonly scene: Phaser.Scene;
  private readonly config: Required<OpponentFanConfig>;
  private readonly cards: Card[] = [];

  constructor(scene: Phaser.Scene, config: OpponentFanConfig = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  spawnFromAvatarBack(
    cardCount: number,
    avatarCenterX: number,
    avatarCenterY: number,
    avatarRadius: number,
  ) {
    if (cardCount <= 0) {
      return;
    }

    this.clearCards();

    const spawnX = avatarCenterX;
    const spawnY = avatarCenterY - avatarRadius * SPAWN_OFFSET_RATIO;

    for (let index = 0; index < cardCount; index += 1) {
      const card = new Card(
        this.scene,
        DECK_BACK_KEY,
        spawnX,
        spawnY,
        this.config.cardScale,
        this.config.depth + index,
      );

      card.sprite.disableInteractive();
      card.sprite.setVisible(false);
      this.cards.push(card);
    }
  }

  layout(
    avatarCenterX: number,
    avatarCenterY: number,
    avatarRadius: number,
    duration: number,
  ) {
    if (this.cards.length === 0) {
      return;
    }

    const outwardAngle = -Math.PI / 2;
    const spreadRadians = Phaser.Math.DegToRad(this.config.spreadDegrees);
    const halfSpread = spreadRadians / 2;
    const firstCard = this.cards[0];
    const orbitRadius =
      avatarRadius +
      firstCard.sprite.displayHeight * 0.28 +
      this.config.orbitPadding;
    const midpoint = (this.cards.length - 1) / 2;

    this.cards.forEach((card, index) => {
      const normalizedOffset =
        midpoint === 0 ? 0 : (index - midpoint) / midpoint;
      const cardAngle = outwardAngle + normalizedOffset * halfSpread;
      const targetX = avatarCenterX + Math.cos(cardAngle) * orbitRadius;
      const targetY = avatarCenterY + Math.sin(cardAngle) * orbitRadius;
      const targetRotation = Phaser.Math.RadToDeg(cardAngle) + 90;

      card.moveTo({
        x: targetX,
        y: targetY,
        angle: targetRotation,
        delay: 0,
        duration,
        ease: "Back.out",
        onStart: () => {
          card.sprite.setVisible(true);
        },
      });

      card.sprite.setDepth(this.config.depth + index);
    });
  }

  destroy() {
    this.clearCards();
  }

  private clearCards() {
    this.cards.forEach((card) => {
      card.stopMotion();
      card.sprite.destroy();
    });
    this.cards.length = 0;
  }
}
