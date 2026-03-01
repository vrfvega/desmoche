import Phaser from "phaser";

type MoveOptions = {
  x: number;
  y: number;
  angle?: number;
  delay?: number;
  duration?: number;
  ease?: string;
  onStart?: () => void;
};

export class Card {
  readonly sprite: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    textureKey: string,
    x: number,
    y: number,
    scale: number,
    depth: number,
  ) {
    this.scene = scene;
    this.sprite = this.scene.add
      .image(x, y, textureKey)
      .setOrigin(0.5)
      .setScale(scale)
      .setDepth(depth)
      .setInteractive({ cursor: "pointer" });
  }

  stopMotion() {
    this.scene.tweens.killTweensOf(this.sprite);
  }

  moveTo({
    x,
    y,
    angle = 0,
    delay = 0,
    duration = 460,
    ease = "Cubic.out",
    onStart,
  }: MoveOptions) {
    this.stopMotion();
    this.scene.tweens.add({
      targets: this.sprite,
      x,
      y,
      angle,
      delay,
      duration,
      ease,
      onStart,
    });
  }
}
