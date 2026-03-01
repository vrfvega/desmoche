import Phaser from "phaser";
import { UI_FONT_FAMILY } from "./constants";

type AvatarConfig = {
  username?: string;
  iconText?: string;
  minRadius?: number;
  radiusScale?: number;
  depth?: number;
};

const DEFAULT_USERNAME = "placeholder";
const DEFAULT_ICON_TEXT = "P";
const DEFAULT_MIN_RADIUS = 28;
const DEFAULT_RADIUS_SCALE = 0.4;
const DEFAULT_DEPTH = 140;

export class Avatar {
  private readonly circle: Phaser.GameObjects.Arc;
  private readonly iconLabel: Phaser.GameObjects.Text;
  private readonly usernameLabel: Phaser.GameObjects.Text;
  private readonly minRadius: number;
  private readonly radiusScale: number;
  private centerX = 0;
  private centerY = 0;
  private radius = 0;

  constructor(scene: Phaser.Scene, config: AvatarConfig = {}) {
    const baseDepth = config.depth ?? DEFAULT_DEPTH;
    this.minRadius = config.minRadius ?? DEFAULT_MIN_RADIUS;
    this.radiusScale = config.radiusScale ?? DEFAULT_RADIUS_SCALE;

    this.circle = scene.add
      .circle(0, 0, 1, 0x1e293b, 1)
      .setStrokeStyle(2, 0x94a3b8, 0.9)
      .setDepth(baseDepth);

    this.iconLabel = scene.add
      .text(0, 0, config.iconText ?? DEFAULT_ICON_TEXT, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "20px",
        color: "#e2e8f0",
      })
      .setOrigin(0.5)
      .setDepth(baseDepth + 1);

    this.usernameLabel = scene.add
      .text(0, 0, config.username ?? DEFAULT_USERNAME, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "16px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5)
      .setDepth(baseDepth + 1);
  }

  setUsername(username: string) {
    this.usernameLabel.setText(username);
  }

  setIconText(iconText: string) {
    this.iconLabel.setText(iconText);
  }

  setVisible(visible: boolean) {
    this.circle.setVisible(visible);
    this.iconLabel.setVisible(visible);
    this.usernameLabel.setVisible(visible);
  }

  layout(centerX: number, centerY: number, radius: number) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;

    this.circle.setPosition(centerX, centerY).setRadius(radius);
    this.iconLabel
      .setPosition(centerX, centerY + 2)
      .setFontSize(Math.max(18, Math.floor(radius * 0.75)));
    this.usernameLabel
      .setPosition(centerX, centerY + radius + 8)
      .setFontSize(Math.max(14, Math.floor(radius * 0.25)));
  }

  layoutTopLeft(offsetX: number, offsetY: number, referenceHeight: number) {
    const radius = this.getRadiusForReference(referenceHeight);
    this.layout(offsetX + radius, offsetY + radius, radius);
  }

  getRadiusForReference(referenceHeight: number) {
    return Math.max(
      this.minRadius,
      Math.floor(referenceHeight * this.radiusScale),
    );
  }

  getLayout() {
    return {
      centerX: this.centerX,
      centerY: this.centerY,
      radius: this.radius,
    };
  }

  destroy() {
    this.circle.destroy();
    this.iconLabel.destroy();
    this.usernameLabel.destroy();
  }
}
