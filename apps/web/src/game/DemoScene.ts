import Phaser from "phaser";
import { Avatar } from "./Avatar";
import { Deck } from "./Deck";
import { DiscardPile } from "./DiscardPile";
import { Hand } from "./Hand";
import { MeldArea } from "./MeldArea";
import { Opponent } from "./Opponent";
import { OpponentFan } from "./OpponentFan";
import { Table } from "./Table";
import { CARD_SCALE, UI_FONT_FAMILY } from "./constants";

const INPUT_AREA_MAX_WIDTH = 800;
const INPUT_AREA_WIDTH_RATIO = 0.92;
const HAND_RELAYOUT_DURATION = 180;
const AVATAR_PADDING = 24;
const TABLE_AVATAR_GAP = 20;
const TABLE_AVATAR_BOTTOM_Y_OFFSET = 28;
const TABLE_AVATAR_HAND_CLEARANCE = 18;
const OPPONENT_OPENING_CARD_COUNT = 9;
const OPPONENT_DEAL_DURATION = 520;

const ACTION_BUTTON_X = 36;
const ACTION_BUTTON_BOTTOM_OFFSET = 120;
const ACTION_BUTTON_VERTICAL_GAP = 60;
const ACTION_BUTTON_WIDTH = 156;
const ACTION_BUTTON_HEIGHT = 48;

const ACTION_BUTTON_BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: UI_FONT_FAMILY,
  fontSize: "21px",
  align: "center",
};

const ACTION_BUTTON_ENABLED_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  color: "#000000",
  backgroundColor: "#eb9225",
};

const ACTION_BUTTON_DISABLED_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  color: "#334155",
  backgroundColor: "#94a3b8",
};

export class DemoScene extends Phaser.Scene {
  private hand: Hand | null = null;
  private deck: Deck | null = null;
  private table: Table | null = null;
  private discardPile: DiscardPile | null = null;
  private meldArea: MeldArea | null = null;
  private playerAvatar: Avatar | null = null;
  private opponentAvatar: Opponent | null = null;
  private opponentFan: OpponentFan | null = null;
  private discardButton: Phaser.GameObjects.Text | null = null;
  private meldButton: Phaser.GameObjects.Text | null = null;
  private discardEnabled = false;
  private meldEnabled = false;
  private meldBoundsCache: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
  private handTopCache = Number.POSITIVE_INFINITY;

  private readonly onSelectionChanged = (selectedCount: number) => {
    this.setDiscardEnabled(selectedCount === 1);
    this.setMeldEnabled(selectedCount >= 3 && selectedCount <= 4);
  };

  constructor() {
    super("demo");
  }

  preload() {
    Deck.preload(this);
  }

  create() {
    this.hand = new Hand(this, CARD_SCALE, this.onSelectionChanged);

    this.deck = new Deck(this, this.hand, CARD_SCALE);
    this.discardPile = new DiscardPile(
      this,
      this.scale.width / 2,
      this.scale.height / 2,
      CARD_SCALE,
    );

    this.createTableObjects();
    this.refreshInputLayout(false);

    this.createActionButtons();
    this.dealOpeningCards();
    this.refreshInputLayout(
      false,
      HAND_RELAYOUT_DURATION,
      OPPONENT_DEAL_DURATION,
    );
    this.positionActionButtons();

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  private createTableObjects() {
    this.table = new Table(
      this,
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
    );

    this.meldArea = new MeldArea(
      this,
      this.scale.width / 2,
      this.scale.height / 2,
    );

    this.playerAvatar = new Avatar(this, {
      username: "username",
      iconText: "U",
    });

    this.opponentAvatar = new Opponent(this, {
      username: "opponent",
      iconText: "O",
      depth: 200,
    });

    this.opponentFan = new OpponentFan(this);
  }

  private refreshInputLayout(
    relayoutHand: boolean,
    handDuration = HAND_RELAYOUT_DURATION,
    opponentFanDuration = HAND_RELAYOUT_DURATION,
  ) {
    if (!this.hand || !this.meldArea) {
      return;
    }

    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;
    const areaWidth = Math.min(
      INPUT_AREA_MAX_WIDTH,
      Math.floor(viewportWidth * INPUT_AREA_WIDTH_RATIO),
    );
    const areaCenterX = viewportWidth / 2;

    this.hand.setLayoutArea(areaCenterX, areaWidth);
    if (relayoutHand) {
      this.hand.relayout(viewportWidth, viewportHeight, handDuration);
    }

    const handBounds = this.hand.getBounds(viewportWidth, viewportHeight);
    const handTop = handBounds?.top ?? viewportHeight - 220;
    this.handTopCache = handTop;
    const meldCenterY = handTop - 72;
    this.meldArea.setPosition(areaCenterX, meldCenterY);
    this.meldBoundsCache = this.meldArea.getBounds();

    this.positionTableSeats(opponentFanDuration);
  }

  private dealOpeningCards() {
    if (!this.deck || !this.opponentAvatar) {
      return;
    }

    this.deck.dealOpeningHand(9);

    const opponentCardsDealt = this.deck.dealBulk(
      OPPONENT_OPENING_CARD_COUNT,
      false,
    );
    if (opponentCardsDealt === 0 || !this.opponentFan) {
      return;
    }

    const opponentLayout = this.opponentAvatar.getLayout();
    this.opponentFan.spawnFromAvatarBack(
      opponentCardsDealt,
      opponentLayout.centerX,
      opponentLayout.centerY,
      opponentLayout.radius,
    );
  }

  private positionTableSeats(opponentFanDuration = HAND_RELAYOUT_DURATION) {
    if (!this.table || !this.playerAvatar || !this.opponentAvatar) {
      return;
    }

    const { centerX, centerY, radius } = this.table.getLayout();
    const avatarReferenceHeight =
      this.meldBoundsCache.height > 0 ? this.meldBoundsCache.height : radius;
    const avatarRadius = this.playerAvatar.getRadiusForReference(
      avatarReferenceHeight,
    );
    const radialDistance = radius + avatarRadius + TABLE_AVATAR_GAP;
    const diagonalOffset = Math.floor(radialDistance / Math.SQRT2);
    const minX = AVATAR_PADDING + avatarRadius;
    const maxX = this.scale.width - AVATAR_PADDING - avatarRadius;
    const minY = AVATAR_PADDING + avatarRadius;
    const maxY = this.scale.height - AVATAR_PADDING - avatarRadius;
    const handSafeMaxY =
      this.handTopCache - TABLE_AVATAR_HAND_CLEARANCE - avatarRadius;

    const playerTargetX = centerX - diagonalOffset;
    const playerTargetY =
      centerY + diagonalOffset - TABLE_AVATAR_BOTTOM_Y_OFFSET;
    const playerX = Phaser.Math.Clamp(playerTargetX, minX, maxX);
    const playerY = Phaser.Math.Clamp(
      Math.min(playerTargetY, handSafeMaxY),
      minY,
      maxY,
    );

    this.playerAvatar.layout(playerX, playerY, avatarRadius);

    const opponentTargetX = centerX + diagonalOffset;
    const opponentTargetY = centerY - diagonalOffset;

    this.opponentAvatar.layout(
      Phaser.Math.Clamp(opponentTargetX, minX, maxX),
      Phaser.Math.Clamp(opponentTargetY, minY, maxY),
      avatarRadius,
    );

    const opponentLayout = this.opponentAvatar.getLayout();
    this.opponentFan?.layout(
      opponentLayout.centerX,
      opponentLayout.centerY,
      opponentLayout.radius,
      opponentFanDuration,
    );
  }

  private createActionButtons() {
    this.discardButton = this.createActionButton("Discard", () => {
      this.handleDiscard();
    });

    this.meldButton = this.createActionButton("Meld", () => {
      this.handleMeld();
    });

    this.setDiscardEnabled(false);
    this.setMeldEnabled(false);
  }

  private createActionButton(label: string, onClick: () => void) {
    const button = this.add
      .text(0, 0, label, {
        ...ACTION_BUTTON_BASE_STYLE,
        ...ACTION_BUTTON_DISABLED_STYLE,
      })
      .setFixedSize(ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT)
      .setPadding(0, 10, 0, 8)
      .setOrigin(0, 0.5)
      .setDepth(140)
      .setInteractive({ cursor: "pointer" });

    button.on("pointerdown", onClick);
    return button;
  }

  private handleDiscard() {
    if (!this.discardEnabled || !this.hand || !this.discardPile) {
      return;
    }

    const discardedCards = this.hand.popSelectedCards();
    if (discardedCards.length === 0) {
      return;
    }

    this.discardPile.addCards(discardedCards);
    const cardsDrawn = this.deck?.drawToHand(1) ?? 0;
    if (cardsDrawn === 0) {
      this.hand.relayout(
        this.scale.width,
        this.scale.height,
        HAND_RELAYOUT_DURATION,
      );
    }

    this.refreshInputLayout(false);
    this.positionActionButtons();
  }

  private handleMeld() {
    if (!this.meldEnabled || !this.hand || !this.meldArea) {
      return;
    }

    const meldCards = this.hand.popSelectedCards();
    if (meldCards.length < 3 || meldCards.length > 4) {
      return;
    }

    this.meldArea.addMeld(meldCards);
    this.hand.relayout(
      this.scale.width,
      this.scale.height,
      HAND_RELAYOUT_DURATION,
    );
    this.refreshInputLayout(false);
    this.positionActionButtons();
  }

  private positionActionButtons() {
    if (!this.discardButton || !this.meldButton) {
      return;
    }

    const discardY = this.scale.height - ACTION_BUTTON_BOTTOM_OFFSET;
    const meldY = discardY + ACTION_BUTTON_VERTICAL_GAP;

    this.discardButton.setPosition(ACTION_BUTTON_X, discardY);
    this.meldButton.setPosition(ACTION_BUTTON_X, meldY);
  }

  private setDiscardEnabled(enabled: boolean) {
    this.discardEnabled = enabled;

    this.applyActionButtonStyle(this.discardButton, enabled);
  }

  private setMeldEnabled(enabled: boolean) {
    this.meldEnabled = enabled;

    this.applyActionButtonStyle(this.meldButton, enabled);
  }

  private applyActionButtonStyle(
    button: Phaser.GameObjects.Text | null,
    enabled: boolean,
  ) {
    if (!button) {
      return;
    }

    button.setStyle(
      enabled ? ACTION_BUTTON_ENABLED_STYLE : ACTION_BUTTON_DISABLED_STYLE,
    );
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.deck?.resize(gameSize.width, gameSize.height);
    this.table?.layout(
      gameSize.width / 2,
      gameSize.height / 2,
      gameSize.width,
      gameSize.height,
    );
    this.discardPile?.setPosition(gameSize.width / 2, gameSize.height / 2);
    this.refreshInputLayout(true, HAND_RELAYOUT_DURATION);
    this.positionActionButtons();
  }

  private handleShutdown() {
    this.scale.off("resize", this.handleResize, this);
    this.table?.destroy();
    this.table = null;
    this.playerAvatar?.destroy();
    this.playerAvatar = null;
    this.opponentAvatar?.destroy();
    this.opponentAvatar = null;
    this.opponentFan?.destroy();
    this.opponentFan = null;
  }
}
