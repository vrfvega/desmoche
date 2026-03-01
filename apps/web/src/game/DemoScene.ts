import Phaser from "phaser";
import { Avatar } from "./Avatar";
import { Deck } from "./Deck";
import { DiscardPile } from "./DiscardPile";
import { Hand } from "./Hand";
import { MeldArea } from "./MeldArea";
import { CARD_SCALE } from "./constants";

const INPUT_AREA_MAX_WIDTH = 800;
const INPUT_AREA_WIDTH_RATIO = 0.92;
const HAND_RELAYOUT_DURATION = 180;
const AVATAR_PADDING = 24;

const ACTION_BUTTON_X = 36;
const ACTION_BUTTON_BOTTOM_OFFSET = 120;
const ACTION_BUTTON_VERTICAL_GAP = 60;
const ACTION_BUTTON_WIDTH = 156;
const ACTION_BUTTON_HEIGHT = 48;

const ACTION_BUTTON_BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "monospace",
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
  private discardPile: DiscardPile | null = null;
  private meldArea: MeldArea | null = null;
  private avatar: Avatar | null = null;
  private discardButton: Phaser.GameObjects.Text | null = null;
  private meldButton: Phaser.GameObjects.Text | null = null;
  private discardEnabled = false;
  private meldEnabled = false;
  private meldBoundsCache: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();

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
    this.deck.dealOpeningHand(9);
    this.refreshInputLayout(false);
    this.positionActionButtons();

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  private createTableObjects() {
    this.meldArea = new MeldArea(
      this,
      this.scale.width / 2,
      this.scale.height / 2,
    );

    this.avatar = new Avatar(this, {
      username: "username",
      iconText: "U",
    });
  }

  private refreshInputLayout(
    relayoutHand: boolean,
    handDuration = HAND_RELAYOUT_DURATION,
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
    const meldCenterY = handTop - 72;
    this.meldArea.setPosition(areaCenterX, meldCenterY);
    this.meldBoundsCache = this.meldArea.getBounds();

    this.positionAvatarTopLeft();
  }

  private positionAvatarTopLeft() {
    if (!this.avatar) {
      return;
    }

    this.avatar.layoutTopLeft(
      AVATAR_PADDING,
      AVATAR_PADDING,
      this.meldBoundsCache.height,
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
    this.positionAvatarTopLeft();

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
    this.discardPile?.setPosition(gameSize.width / 2, gameSize.height / 2);
    this.refreshInputLayout(true, HAND_RELAYOUT_DURATION);
    this.positionActionButtons();
  }

  private handleShutdown() {
    this.scale.off("resize", this.handleResize, this);
    this.avatar?.destroy();
    this.avatar = null;
  }
}
