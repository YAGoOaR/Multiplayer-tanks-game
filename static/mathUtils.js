
class VectorUtils {

  static vectorLength(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  static get EmptyVector() {
    return { x: 0, y: 0 };
  }

  static addVectors(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }

  static subtractVectors(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  }

  static multiplyVector(vector, number) {
    return {
      x: vector.x * number,
      y: vector.y * number
    };
  }

  static clampVector(vector, max) {
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

  static SetVector(vector, x, y) {
    vector.x = x;
    vector.y = y;
  }

  static CopyVector(dest, source) {
    dest.x = source.x;
    dest.y = source.y;
  }

  static vectorAngle(vector) {
    const length = VectorUtils.vectorLength(vector);
    return Math.acos(vector.x / length) * Math.sign(vector.y);
  }
}

export { VectorUtils };
