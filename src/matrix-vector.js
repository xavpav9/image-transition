function indexToMatrix(m, indices) {
  return indices.map(val => m[val]);
}

function det2(m) {
  return m[0] * m[3] - m[1] * m[2];
}

function det3(m) {
  return m[0] * det2(indexToMatrix(m, [4, 5, 7, 8])) -
    m[1] * det2(indexToMatrix(m, [3, 5, 6, 8])) +
    m[2] * det2(indexToMatrix(m, [3, 4, 6, 7]));
}

function det4(m) {
  return m[0] * det3(indexToMatrix(m, [5, 6, 7, 9, 10, 11, 13, 14, 15])) -
    m[1] * det3(indexToMatrix(m, [4, 6, 7, 8, 10, 11, 12, 14, 15])) +
    m[2] * det3(indexToMatrix(m, [4, 5, 7, 8, 9, 11, 12, 13, 15])) -
    m[3] * det3(indexToMatrix(m, [4, 5, 6, 8, 9, 10, 12, 13, 14]));
}

const m4 = (function() {
  function multiply(a, b) {
    const rowIndices = [0, 1, 2, 3];
    const columnIndices = [0, 4, 8, 12];
    let m = [];

    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        const columns = a.filter((item, index) => columnIndices.includes(index - c));
        const rows = b.filter((item, index) => rowIndices.includes(index - 4*r));
        m.push(rowIndices.reduce((acc, cur) => acc + columns[cur] * rows[cur], 0));
      }
    }

    return m;
  }

  function perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY/2);
    const rangeInv = 1 / (near - far);
    return [
      f/aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near+far)*rangeInv, -1,
      0, 0, 2*near*far*rangeInv, 0,
    ];
  }

  function transpose(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  }

  function inverse(m) {
    const d = det4(m);
    const indices = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    const newM = [];

    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        const indicesToBeRemoved = [4*r, 4*r+1, 4*r+2, 4*r+3, c, c+4, c+8, c+12];
        const sign = (-1) ** (r+c);
        const minor = det3(indexToMatrix(m, indices.filter(val => !indicesToBeRemoved.includes(val))))
        newM.push(sign * minor);
      }
    }
    
    return transpose(newM).map(val => val/d);
  }

  function lookAt(cameraPosition, target, up) {
    const zAxis = v3.normalise(v3.subtract(cameraPosition, target));
    const xAxis = v3.normalise(v3.cross(up, zAxis));
    const yAxis = v3.normalise(v3.cross(zAxis, xAxis));

    return [
      ...xAxis, 0,
      ...yAxis, 0,
      ...zAxis, 0,
      ...cameraPosition, 1,
    ];
  }


  function translation(tx, ty, tz) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      tx, ty, tz, 1,
    ];
  }

  function rollRotation(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  }

  function pitchRotation(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  }

  function yawRotation(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  function scaling(sx, sy, sz) {
    return [
      sx, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, sz, 0,
      0, 0, 0, 1,
    ];
  }


  const translate = (m, t) => multiply(m, translation(t[0], t[1], t[2]));
  const rollRotate = (m, a) => multiply(m, rollRotation(a));
  const pitchRotate = (m, a) => multiply(m, pitchRotation(a));
  const yawRotate = (m, a) => multiply(m, yawRotation(a));
  const scale = (m, s) => multiply(m, scaling(s[0], s[1], s[2]));

  const methods = {
    multiply,
    perspective,
    transpose,
    inverse,
    lookAt,

    translation,
    rollRotation,
    pitchRotation,
    yawRotation,
    scaling,

    translate,
    rollRotate,
    pitchRotate,
    yawRotate,
    scale,
  }

  Object.defineProperty(methods, "identity", {
    get() {
      return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ];
    }
  });

  return methods;
})();

const v3 = (function() {
  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function normalise(v) {
    const length = Math.sqrt(v.reduce((acc, cur) => acc + cur ** 2, 0));
    if (length < 0.000001) return [0, 0, 0];
    else return v.map(val => val / length);
  }

  return {
    subtract,
    cross,
    normalise,
  };
})();

const m3 = (function() {
  function multiply(a, b) {
    const rowIndices = [0, 1, 2];
    const columnIndices = [0, 4, 8];
    let m = [];

    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        const columns = a.filter((item, index) => columnIndices.includes(index - c));
        const rows = b.filter((item, index) => rowIndices.includes(index - 3*r));
        m.push(rowIndices.reduce((acc, cur) => acc + columns[cur] * rows[cur], 0));
      }
    }

    return m;
  }

  function projection(width, height, flipY) {

    return [
      2/width, 0, 0,
      0, -2/height, 0,
      -1, flipY ? -1 : 1, 1,
    ];
  }

  function transpose(m) {
    return [
      m[0], m[3], m[6],
      m[1], m[4], m[7],
      m[2], m[5], m[8],
    ];
  }

  function inverse(m) {
    const d = det3(m);
    const indices = [0,1,2,3,4,5,6,7,8];
    const newM = [];

    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        const indicesToBeRemoved = [3*r, 3*r+1, 3*r+2, c, c+3, c+6];
        const sign = (-1) ** (r+c);
        const minor = det2(indexToMatrix(m, indices.filter(val => !indicesToBeRemoved.includes(val))))
        newM.push(sign * minor);
      }
    }
    
    return transpose(newM).map(val => val/d);
  }

  function translation(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  }

  function rotation(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  }

  function scaling(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  }


  const translate = (m, t) => multiply(m, translation(t[0], t[1]));
  const rotate = (m, a) => multiply(m, rotation(a));
  const scale = (m, s) => multiply(m, scaling(s[0], s[1]));

  const methods = {
    multiply,
    projection,
    transpose,
    inverse,

    translation,
    rotation,
    scaling,

    translate,
    rotate,
    scale,
  }

  Object.defineProperty(methods, "identity", {
    get() {
      return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ];
    }
  });

  return methods;
})();

export {v3, m4, m3};
