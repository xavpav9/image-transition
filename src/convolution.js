import {m3} from "./matrix-vector.js";
import {createAndSetupTexture} from "./shader.js";
import vsSource from "./shaders/convolution-vs.txt";
import fsSource from "./shaders/convolution-fs.txt";

function getTexture(gl, originalImageTexture, effectsToApply) {
  let size, type, normalise, stride, offset;

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = createProgram(gl, vs, fs);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");

  const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
  const imageUniformLocation = gl.getUniformLocation(program, "u_image");
  const kernelUniformLocation = gl.getUniformLocation(program, "u_kernel");
  const kernelWeightUniformLocation = gl.getUniformLocation(program, "u_kernelWeight");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,
  ]), gl.STATIC_DRAW);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttributeLocation);
  size = 2;
  type = gl.FLOAT;
  normalise = false;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalise, stride, offset);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    1, 0,
    0, 0,
    1, 1,
    1, 1,
    0, 0,
    0, 1,
  ]), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(texcoordAttributeLocation);
  size = 2;
  type = gl.FLOAT;
  normalise = true;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(texcoordAttributeLocation, size, type, normalise, stride, offset);

  const textures = [];
  const framebuffers = [];
  for (let i = 0; i < 2; ++i) {
    const texture = createAndSetupTexture();
    textures.push(texture);

    const mipLevel = 0;
    const srcFormat = gl.RGBA;
    const width = originalImageTexture.width;
    const height = originalImageTexture.height;
    const border = 0;
    const internalFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const data = null;

    g.texImage2D(gl.TEXTURE_2D, mipLevel, srcType, width, height, border, internalFormat, srcType, data);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    framebuffers.push(fbo);

    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }

  const kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0,
    ],
    emboss: [
      -2, -1, 0,
      -1, 1, 1,
      0, -1, 2,
    ],
    edgeDetect: [
      0, 1, 0,
      1, -4, 1,
      0, 1, 0,
    ],
    sharpen: [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0,
    ],
  };

  let count = 0;
  for (let i = 0; i < effectsToApply.length; ++i) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[count % 2]);
    drawEffect(kernels[effectsToApply]);
    gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);
    ++count;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return textures[(count + 1) % 2];


  function drawEffect(kernel) {
    let primitiveType, offset, count;

    gl.canvas.height = originalImageTexture.height;
    gl.canvas.width = originalImageTexture.width;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0 + 0);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.CLEAR_BUFFER_BIT);

    let projectionMatrix = m3.projection(gl.canvas.width, gl.canvas.height, false);

    gl.uniform1fv(kernelUniformLocation, kernel);
    gl.uniform1f(kernelWeightUniformLocation, kernelWeight);
    gl.uniformMatrix3fv(matrixUniformLocation, false, projectionMatrix);

    gl.uniform1i(imageUniformLocation, 0);
    primitiveType = gl.TRIANGLES;
    offset = 0;
    count = 6 * 1;
    gl.drawArrays(primitiveType, offset, count);
  }
}

function computeKernelWeight(kernel) {
  let kernelWeight = kernel.reduce((acc, cur) => acc + cur, 0);
  if (kernelWeight <= 0) kernelWeight = 1;
  return kernelWeight;
}

export {getTexture};
