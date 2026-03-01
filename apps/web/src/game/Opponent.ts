import Phaser from "phaser";
import { Avatar } from "./Avatar";

type OpponentConfig = ConstructorParameters<typeof Avatar>[1];

export class Opponent extends Avatar {
  constructor(scene: Phaser.Scene, config: OpponentConfig = {}) {
    super(scene, config);
  }
}
