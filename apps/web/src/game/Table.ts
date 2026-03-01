import Phaser from "phaser";

type TableConfig = {
  depth?: number;
  strokeColor?: number;
  strokeAlpha?: number;
  strokeWidth?: number;
  fillColor?: number;
  fillAlpha?: number;
  radiusRatio?: number;
  minRadius?: number;
  maxRadius?: number;
};

const DEFAULT_CONFIG: Required<TableConfig> = {
  depth: 2,
  strokeColor: 0x94a3b8,
  strokeAlpha: 0.28,
  strokeWidth: 2,
  fillColor: 0x0b1220,
  fillAlpha: 0,
  radiusRatio: 0.24,
  minRadius: 400,
  maxRadius: 500,
};

export class Table {
  private readonly config: Required<TableConfig>;
  private readonly ring: Phaser.GameObjects.Arc;
  private centerX: number;
  private centerY: number;
  private radius: number;

  constructor(
    scene: Phaser.Scene,
    centerX: number,
    centerY: number,
    viewportWidth: number,
    viewportHeight: number,
    config: TableConfig = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = this.resolveRadius(viewportWidth, viewportHeight);

    this.ring = scene.add
      .circle(
        centerX,
        centerY,
        this.radius,
        this.config.fillColor,
        this.config.fillAlpha,
      )
      .setStrokeStyle(
        this.config.strokeWidth,
        this.config.strokeColor,
        this.config.strokeAlpha,
      )
      .setDepth(this.config.depth);
  }

  layout(
    centerX: number,
    centerY: number,
    viewportWidth: number,
    viewportHeight: number,
  ) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = this.resolveRadius(viewportWidth, viewportHeight);

    this.ring.setPosition(centerX, centerY).setRadius(this.radius);
  }

  getLayout() {
    return {
      centerX: this.centerX,
      centerY: this.centerY,
      radius: this.radius,
    };
  }

  destroy() {
    this.ring.destroy();
  }

  private resolveRadius(viewportWidth: number, viewportHeight: number) {
    const idealRadius =
      Math.min(viewportWidth, viewportHeight) * this.config.radiusRatio;
    return Phaser.Math.Clamp(
      Math.floor(idealRadius),
      this.config.minRadius,
      this.config.maxRadius,
    );
  }
}
