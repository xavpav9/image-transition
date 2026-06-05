import "./style.css";
import {m4, v3} from "./matrix-vector.js";
import {createShader, createProgram, createAndSetupTexture} from "./shader.js";
import {handleDom} from "./dom-handler.js";
import {getTexture}  from "./convolution.js";

import frontImg from "./images/river.jpeg";
import backImg from "./images/ducks.jpeg";
import fsSource from "./shaders/canvas-fs.txt";
import vsSource from "./shaders/canvas-vs.txt";


function main() {
  let size, type, normalise, stride, offset;

  // Initialise webgl2
  const canvas = document.querySelector("#c");
  const gl = canvas.getContext("webgl2");
  if (gl === null) return;

  // Create program
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = createProgram(gl, vs, fs);

  // Get attribute and uniform locations from shader program
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const normalAttributeLocation = gl.getAttribLocation(program, "a_normal");
  const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");

  const worldViewProjectionUniformLocation = gl.getUniformLocation(program, "u_worldViewProjection");
  const lightDirectionUniformLocation = gl.getUniformLocation(program, "u_lightDirection");
  const worldInverseTransposeUniformLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
  const textureUniformLocation = gl.getUniformLocation(program, "u_texture");

  // Create position buffer with a 50x50x50 cube (positive Y down)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttributeLocation);
  size = 3;
  type = gl.FLOAT;
  normalise = false;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalise, stride, offset);

  // Create buffer for the normals of each side of the cube
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
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

  gl.enableVertexAttribArray(normalAttributeLocation);
  size = 3;
  type = gl.FLOAT;
  normalise = true;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(normalAttributeLocation, size, type, normalise, stride, offset);
  
  // Create buffer for the coordinates of the textures to use on each side
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
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

  gl.enableVertexAttribArray(texcoordAttributeLocation);
  size = 2;
  type = gl.FLOAT;
  normalise = true;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(texcoordAttributeLocation, size, type, normalise, stride, offset);

  // Create each texture (front, back and side)
  let mipLevel = 0;
  let srcFormat = gl.RGBA;
  let internalFormat = gl.RGBA;
  let srcType = gl.UNSIGNED_BYTE;

  const frontTexture = createAndSetupTexture(gl, 0);
  gl.texImage2D(gl.TEXTURE_2D, mipLevel, srcFormat, 1, 1, 0, internalFormat, srcType, new Uint8Array([0, 255, 0, 255]));

  const backTexture = createAndSetupTexture(gl, 1);
  gl.texImage2D(gl.TEXTURE_2D, mipLevel, srcFormat, 1, 1, 0, internalFormat, srcType, new Uint8Array([0, 0, 255, 255]));

  const sideTexture = createAndSetupTexture(gl, 2);
  gl.texImage2D(gl.TEXTURE_2D, mipLevel, srcFormat, 1, 1, 0, internalFormat, srcType, new Uint8Array([200, 200, 200, 255]));

  // Set up images, which all have a fail-safe flat colour (set above)
  const frontImage = new Image();
  frontImage.src = frontImg;

  frontImage.addEventListener("load", evt => {
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, frontTexture);
    gl.texImage2D(gl.TEXTURE_2D, mipLevel, srcFormat, internalFormat, srcType, frontImage);
  });

  const backImage = new Image();
  backImage.src = backImg;

  backImage.addEventListener("load", evt => {
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, backTexture);
    gl.texImage2D(gl.TEXTURE_2D, mipLevel, srcFormat, internalFormat, srcType, backImage);
  });



  // Set up animation timer and variables passed to the DOM handler to allow the user to edit them via UI
  let then = 0;

  const properties = {
    startingZ: -221,
    worldAngle: [0, 0, 0],
    worldTranslation: [0, 0, 0],
    rotationSpeed: 0.5,
    translationSpeed: -90,
    backImage,
    frontImage,
  };

  handleDom(properties);

  let maxAngle = Math.PI;
  let flipped = false;

  let running = false;
  canvas.addEventListener("click", evt => {
    running = true;
  });

  requestAnimationFrame(drawScene);

  function drawScene(now) {
    let primitiveType, offset, count;

    const timeDelta = (now - then) / 1000;
    then = now;

    if (properties.worldAngle[0] >= maxAngle) { // Transition animation has finished
      running = false;
      flipped = false;
      properties.worldAngle[0] = maxAngle % (2 * Math.PI);
      properties.worldTranslation[2] = 0;

      maxAngle = maxAngle === 2*Math.PI ? Math.PI : 2*Math.PI;

    } else if (running) {
      let delta;

      if (properties.worldAngle[0] + timeDelta * properties.rotationSpeed > maxAngle) { // If the angle exceeds maxAngle, use the (maxAngle - angle) for angleDelta
        delta = (maxAngle - properties.worldAngle[0]) / properties.rotationSpeed;
      } else if (!flipped && properties.worldAngle[0] + timeDelta * properties.rotationSpeed > Math.PI / 2 - Math.PI + maxAngle) { // If the angle exceeds the point where the cuboid starts coming back on itself, use the flipping angle (maxAngle - Math.PI/2) to find out the new angleDelta as done above
        delta = (maxAngle - Math.PI/2 - properties.worldAngle[0]) / properties.rotationSpeed;
        flipped = true;
      } else {
        delta = timeDelta;
      };
      properties.worldAngle[0] += delta * properties.rotationSpeed;

      if (properties.worldAngle[0] >= Math.PI / 2 - Math.PI + maxAngle) {
        properties.worldTranslation[2] += delta * -properties.translationSpeed;
      } else {
        properties.worldTranslation[2] += delta * properties.translationSpeed;
      };
    };

    // Set gl.canvas and viewport dimensions
    gl.canvas.height = canvas.clientHeight;
    gl.canvas.width = canvas.clientWidth;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Set options and program
    gl.useProgram(program);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear screen
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.CLEAR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up matrices for transformations
    const zNear = 1;
    const zFar = 2000;
    const aspect = gl.canvas.width / gl.canvas.height;
    const fovY = Math.PI / 3;
    const cameraPosition = [0, 0, 0];
    const lightDirection = [0, 0, -1];

    let worldMatrix = m4.identity;
    worldMatrix = m4.translate(worldMatrix, [properties.worldTranslation[0], properties.worldTranslation[1], properties.worldTranslation[2] + properties.startingZ]);
    worldMatrix = m4.rollRotate(worldMatrix, properties.worldAngle[0]);
    // worldMatrix = m4.pitchRotate(worldMatrix, properties.worldAngle[0]);
    worldMatrix = m4.yawRotate(worldMatrix, properties.worldAngle[0]);

    worldMatrix = m4.scale(worldMatrix, [gl.canvas.width/100, gl.canvas.height/100, 1]);

    worldMatrix = m4.yawRotate(worldMatrix, Math.PI); // partially revert the y-flip from original coords ( will still remain inverted )
    worldMatrix = m4.translate(worldMatrix, [-25,-25,-25]);


    let cameraMatrix = m4.identity;
    cameraMatrix = m4.translate(cameraMatrix, cameraPosition);

    cameraMatrix = m4.lookAt([cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]], [0, 0, -5], [0, 1, 0]);
    let viewMatrix = m4.inverse(cameraMatrix);

    let projectionMatrix = m4.perspective(fovY, aspect, zNear, zFar);
    let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    let worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);

    let worldInverseMatrix = m4.inverse(worldMatrix);
    let worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    // Set matrices and light direction in shaders
    gl.uniformMatrix4fv(worldViewProjectionUniformLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeUniformLocation, false, worldInverseTransposeMatrix); 
    gl.uniform3fv(lightDirectionUniformLocation, v3.normalise(lightDirection));


    // Display front face
    gl.uniform1i(textureUniformLocation, 0);
    primitiveType = gl.TRIANGLES;
    offset = 0;
    count = 6 * 1;
    gl.drawArrays(primitiveType, offset, count);


    // Display back face
    gl.uniform1i(textureUniformLocation, 1);
    offset = 6;
    count = 6 * 1;
    gl.drawArrays(primitiveType, offset, count);


    // Display side faces
    gl.uniform1i(textureUniformLocation, 2);
    offset = 12;
    count = 6 * 4;
    gl.drawArrays(primitiveType, offset, count);

    requestAnimationFrame(drawScene);
  }
}

main(); // Start rendering
