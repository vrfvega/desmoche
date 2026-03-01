import Phaser from "phaser";
import { Card } from "./Card.ts";
import { DECK_BACK_KEY, UI_FONT_FAMILY } from "./constants";

export class MeldArea {
  private readonly scene: Phaser.Scene;
  private centerX: number;
  private centerY: number;
  private readonly slot: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly groups: Card[][] = [];
  private readonly intraSpacing = 30;
  private readonly groupGap = 24;
  private readonly meldScale = 1.75;
  private readonly slotHorizontalPadding = 18;
  private readonly slotVerticalPadding = 12;
  private readonly minSlotWidth: number;
  private readonly minSlotHeight: number;

  constructor(scene: Phaser.Scene, centerX: number, centerY: number) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerY = centerY;

    const deckFrame = this.scene.textures.getFrame(DECK_BACK_KEY);
    const frameWidth = deckFrame?.width ?? 71;
    const frameHeight = deckFrame?.height ?? 96;
    this.minSlotWidth =
      frameWidth * this.meldScale + this.intraSpacing * 2 + 20;
    this.minSlotHeight =
      frameHeight * this.meldScale + this.slotVerticalPadding * 2;

    this.slot = this.scene.add
      .rectangle(
        this.centerX,
        this.centerY,
        this.minSlotWidth,
        this.minSlotHeight,
      )
      .setStrokeStyle(2, 0x94a3b8, 0.35)
      .setFillStyle(0x0b1220, 0.14)
      .setDepth(8);

    this.label = this.scene.add
      .text(this.centerX, this.centerY - this.getLabelOffsetY(), "Melds", {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "16px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  setPosition(centerX: number, centerY: number) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.layoutGroups(180);
  }

  addMeld(cards: Card[]) {
    if (cards.length === 0) {
      return;
    }

    cards.forEach((card) => {
      card.sprite.disableInteractive();
      card.sprite.setScale(this.meldScale);
    });

    this.groups.push(cards);
    this.layoutGroups(260);
  }

  getBounds() {
    return this.slot.getBounds();
  }

  private layoutGroups(duration: number) {
    const groupWidths = this.groups.map((group) => {
      if (group.length === 0) {
        return 0;
      }

      const cardWidth = group[0].sprite.displayWidth;
      return cardWidth + (group.length - 1) * this.intraSpacing;
    });

    const totalGroupsWidth = groupWidths.reduce((sum, width) => sum + width, 0);
    const totalGapWidth = Math.max(this.groups.length - 1, 0) * this.groupGap;
    const contentWidth = totalGroupsWidth + totalGapWidth;
    const slotWidth = Math.max(
      this.minSlotWidth,
      contentWidth + this.slotHorizontalPadding * 2,
    );

    this.slot.setSize(slotWidth, this.minSlotHeight);
    this.slot.setPosition(this.centerX, this.centerY);
    this.label.setPosition(this.centerX, this.centerY - this.getLabelOffsetY());

    let cursorX = this.centerX - contentWidth / 2;

    this.groups.forEach((group, groupIndex) => {
      const groupWidth = groupWidths[groupIndex];
      const cardWidth = group[0]?.sprite.displayWidth ?? 0;
      const groupStartX = cursorX;

      group.forEach((card, cardIndex) => {
        const targetX =
          groupStartX + cardWidth / 2 + cardIndex * this.intraSpacing;
        const targetY = this.centerY;

        card.moveTo({
          x: targetX,
          y: targetY,
          angle: 0,
          delay: cardIndex * 50,
          duration,
          ease: "Sine.out",
        });

        card.sprite.setDepth(110 + groupIndex * 10 + cardIndex);
      });

      cursorX += groupWidth + this.groupGap;
    });
  }

  private getLabelOffsetY() {
    return this.slot.displayHeight / 2 + 16;
  }
}
