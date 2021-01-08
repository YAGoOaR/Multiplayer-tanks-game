'use strict';

const PLAYER_COLLIDER_SIZE = 15;
const GUN_OFFSET = 18;
const BULLET_SPEED = 500;
const SPAWN_DISTANCE = 120;

const TURN_SENSITIVITY = 2;
const MOVE_SENSITIVITY = 100;

const PLAYER_SIZE_X = 40;
const PLAYER_SIZE_Y = 30;
const PLAYERTOP_SIZE_X = 60;
const PLAYERTOP_SIZE_Y = 30;
const BULLET_SIZE_X = 10;
const BULLET_SIZE_Y = 5;

const { Vector2, GameObject } = require('./physics.js');

class Bullet extends GameObject {
  constructor(playerPos = Vector2.zero, playerHeadingAngle, playerId = -1) {

    const playerHeading = Vector2.makeFromAngle(playerHeadingAngle);
    const gunOffset = playerHeading.multiply(GUN_OFFSET);
    const bulletPos = playerPos.add(gunOffset);

    super(bulletPos);

    this.velocity = playerHeading.multiply(BULLET_SPEED);
    this.rotation = playerHeading;
    this.heading = playerHeadingAngle;
    this.playerId = playerId;
    this.objType = 'bullet';
    this.textureSize = new Vector2(BULLET_SIZE_X, BULLET_SIZE_Y);
    this.textureId = 4;
    setTimeout(() => {
      GameObject.Destroy(this);
    }, 1000);
  }
}

class Player extends GameObject {

  constructor() {
    const pos = Player.getNewPlayerPos();
    super(pos);
    this.playerId = Player.count;
    this.heading = 0;
    this.objType = 'player';
    this.size = PLAYER_COLLIDER_SIZE;
    this.hp = 3;
    this.controls = new Vector2(0, 0);
    this.textureSize = new Vector2(PLAYER_SIZE_X, PLAYER_SIZE_Y);
    this.topTextureSize = new Vector2(PLAYERTOP_SIZE_X, PLAYERTOP_SIZE_Y);
    this.textureId = 0;
    this.alternativeTextureId = 1;
    this.topTextureId = 2;
    this.dead = false;
    Player.players[Player.count] = this;
    Player.count++;
  }

  damage() {
    this.hp--;
    if (this.hp < 1) {
      this.dead = true;
      GameObject.Destroy(this);
      return;
    }
  }

  static Controls() {
    for (const player of Player.players) {
      if (!player) continue;
      player.angularSpeed = player.controls.x * TURN_SENSITIVITY;
      const rotationVector = Vector2.makeFromAngle(player.rotation);
      const velocity = player.controls.y * MOVE_SENSITIVITY;
      player.velocity = rotationVector.multiply(velocity);
    }
  }

  static Input(data) {
    const playerId = data.playerId;
    const player = Player.players[playerId];
    if (player) {
      const controls = data.controls;
      Player.players[playerId].controls.Set(controls.x, controls.y);
      Player.players[playerId].heading = data.heading;
      if (data.LBDown === true && player.dead === false) {
        const headingAngle = data.heading;
        const playerPos = player.position;

        new Bullet(playerPos, headingAngle, playerId);
      }
    }
  }

  static RemovePlayer(playerId) {
    if (!Player.players[playerId]) return;
    GameObject.Destroy(Player.players[playerId]);
    delete Player.players[playerId];
  }

  static getNewPlayerPos() {
    let acc = 0;
    for (let i = 0; i < Player.count; i++) {
      const j = i % 2;
      if (j) {
        acc += Math.PI / 2 / i;
      }
      acc += Math.PI;
    }
    const spawnVector = (Vector2.makeFromAngle(-Math.PI / 2 + acc));
    const middlePos = GameObject.gameField.divide(2);
    return spawnVector.multiply(SPAWN_DISTANCE).add(middlePos);
  }

}

Player.players = [];
Player.count = 0;

module.exports = { Player, Bullet };
