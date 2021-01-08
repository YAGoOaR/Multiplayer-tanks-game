'use strict';

const GAME_FIELD_SIZEX = 500;
const GAME_FIELD_SIZEY = 500;

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static clamp(max, vector) {
    if (vector.x < 0) {
      vector.x = 0;
    }
    if (vector.y < 0) {
      vector.y = 0;
    }
    if (vector.x > max.x) {
      vector.x = max.x;
    }
    if (vector.y > max.y) {
      vector.y = max.y;
    }
  }

  static getAngle(vector) {
    return Math.acos(vector.x / vector.length) * Math.sign(vector.y);
  }

  static makeFromAngle(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  static equals(vector1, vector2) {
    return vector1.x === vector2.x && vector1.y === vector2.y;
  }

  static objToVector2(obj) {
    return new Vector2(obj.x, obj.y);
  }

  static angle(v1, v2) {
    return Math.acos(v1.scalarMultiply(v2) / (v1.length * v2.length));
  }

  scalarMultiply(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  Set(x, y) {
    this.x = x;
    this.y = y;
  }

  get length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  normalized() {
    const len = this.length;
    return new Vector2(this.x / len, this.y / len);
  }

  add(vector) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }

  subtract(vector) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }

  inverted() {
    return new Vector2(-this.x, -this.y);
  }

  rotate(angle) {
    const newAngle = Vector2.getAngle(this) + angle;
    return Vector2.makeFromAngle(newAngle).multiply(this.length);
  }

  multiply(n) {
    return new Vector2(this.x * n, this.y * n);
  }

  divide(n) {
    return new Vector2(this.x / n, this.y / n);
  }

  ToString() {
    return '{ ' + Math.round(this.x) + ', ' + Math.round(this.y) + ' }';
  }

}

class GameObject {

  constructor(position = new Vector2(0, 0)) {
    this.position = position;
    this.velocity = new Vector2(0, 0);
    this.rotation = 0;
    this.angularSpeed = 0;
    this.objType = 'default';
    this.size = 0;
    this.textureSize = new Vector2(0, 0);
    this.textureId = -1;
    this.hp = 0;
    GameObject.objects.push(this);
  }

  static checkCircleCollision(obj, obj2) {
    const distance = obj2.position.subtract(obj.position).length;
    return distance < obj2.size + obj.size;
  }

  static checkPlayerCollision(player, movement) {
    for (const obj2 of GameObject.objects) {
      if (obj2.objType === 'obstacle') {
        if (GameObject.checkCircleCollision(player, obj2)) {
          player.position = player.position.subtract(movement);
          player.velocity = Vector2.zero;
          break;
        }
      }
    }
  }

  static checkHit(bullet) {
    for (const obj2 of GameObject.objects) {
      if (obj2.objType === 'player') {
        if (GameObject.checkCircleCollision(bullet, obj2) && !obj2.dead) {
          GameObject.Destroy(bullet);
          obj2.damage();
          break;
        }
      } else if (obj2.objType === 'obstacle') {
        if (obj2.checkCollider(bullet.position)) {
          GameObject.Destroy(bullet);
          break;
        }
      }
    }
  }

  static Physics() {
    const time = Date.now();
    const deltaTime = (time - GameObject.prevTime) / 1000;
    GameObject.prevTime = time;
    for (const obj of GameObject.objects) {
      if (obj.objType === 'obstacle') continue;
      obj.rotation += obj.angularSpeed * deltaTime;
      const movement = obj.velocity.multiply(deltaTime);
      obj.position = obj.position.add(movement);

      if (obj.objType === 'bullet') {
        GameObject.checkHit(obj);
      } else if (obj.objType === 'player') {
        GameObject.checkPlayerCollision(obj, movement);
        Vector2.clamp(GameObject.gameField, obj.position);
      }
    }
  }

  static Destroy(obj) {
    const i = GameObject.objects.indexOf(obj);
    if (i !== -1) {
      GameObject.objects.splice(i, 1);
    }
  }
}

Vector2.zero = new Vector2(0, 0);

GameObject.objects = [];
GameObject.prevTime = Date.now();
GameObject.gameField = new Vector2(GAME_FIELD_SIZEX, GAME_FIELD_SIZEY);

module.exports = { GameObject, Vector2 };
