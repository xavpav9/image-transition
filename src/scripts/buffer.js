function setGeometry(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    //front
    0, 0, 50,
    50, 0, 50,
    0, 50, 50,
    0, 50, 50,
    50, 0, 50,
    50, 50, 50,

    //back
    50, 0, 0,
    0, 0, 0,
    50, 50, 0,
    50, 50, 0,
    0, 0, 0,
    0, 50, 0,

    //top
    50, 0, 50,
    0, 0, 50,
    50, 0, 0,
    50, 0, 0,
    0, 0, 50,
    0, 0, 0,

    //bottom
    0, 50, 50,
    50, 50, 50,
    0, 50, 0,
    0, 50, 0,
    50, 50, 50,
    50, 50, 0,

    //right
    50, 0, 50,
    50, 0, 0,
    50, 50, 50,
    50, 50, 50,
    50, 0, 0,
    50, 50, 0,

    //left
    0, 0, 0,
    0, 0, 50,
    0, 50, 0,
    0, 50, 0,
    0, 0, 50,
    0, 50, 50,

  ]), gl.STATIC_DRAW);
}

function setNormals(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    //front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    //back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    //top
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    //bottom
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    //right
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    //left
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

  ]), gl.STATIC_DRAW);
}

function setTexcoords(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    //front
    1, 0,
    0, 0,
    1, 1,
    1, 1,
    0, 0,
    0, 1,

    //back
    1, 0,
    0, 0,
    1, 1,
    1, 1,
    0, 0,
    0, 1,

    //top
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,

    //bottom
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,

    //right
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,

    //left
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,

  ]), gl.STATIC_DRAW);
}

export {setGeometry, setNormals, setTexcoords};
