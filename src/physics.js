'use strict';

const objects = [];

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
    return Math.acos(vector.x / vector.length()) * Math.sign(vector.y);
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

  Set(x, y) {
    this.x = x;
    this.y = y;
  }

  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  normalized() {
    const length = this.length();
    return new Vector2(this.x / length, this.y / length);
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
    return Vector2.makeFromAngle(this.length(), Vector2.getAngle(this) + angle);
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

  constructor() {
    this.position = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);
    this.rotation = 0;
    this.angularSpeed = 0;
    objects.push(this);
  }

  static Physics() {
    const time = Date.now();
    const deltaTime = (time - GameObject.prevTime) / 1000;
    GameObject.prevTime = time;
    for (const obj of objects) {
      if (!obj) continue;
      obj.rotation += obj.angularSpeed * deltaTime;
      obj.position = obj.position.add(obj.velocity.multiply(deltaTime));
    }
  }

  static Destroy(obj) {
    const i = objects.indexOf(obj);
    if (i > -1) {
      delete objects[i];
    }
  }

}

GameObject.prevTime = Date.now();

module.exports = { GameObject, Vector2 };
