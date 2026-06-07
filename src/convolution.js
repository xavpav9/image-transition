import {m3} from "./matrix-vector.js";
import {createShader, createProgram, createAndSetupTexture} from "./shader.js";
import vsSource from "./shaders/convolution-vs.txt";
import fsSource from "./shaders/convolution-fs.txt";

// Set up global convolution variables in an object
const convolutionVars = {
  textures: [],
  framebuffers: [],
  program: undefined,
  vao: undefined,
  matrixUniformLocation: undefined,
  imageUniformLocation: undefined,
  kernelUniformLocation: undefined,
  kernelWeightUniformLocation: undefined,
}

function setUpConvolutionTextures(gl) { // Set up the textures and framebuffers for the convolution kernel
  let size, type, normalise, stride, offset;

  // Clear texture and framebuffer arrays
  while (convolutionVars.textures.length > 0) convolutionVars.textures.pop();
  while (convolutionVars.framebuffers.length > 0) convolutionVars.framebuffers.pop();

  // Create program with convolution shaders
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  convolutionVars.program = createProgram(gl, vs, fs);

  // Get Attribute & Uniform locations
  const positionAttributeLocation = gl.getAttribLocation(convolutionVars.program, "a_position");
  const texcoordAttributeLocation = gl.getAttribLocation(convolutionVars.program, "a_texcoord");

  convolutionVars.matrixUniformLocation = gl.getUniformLocation(convolutionVars.program, "u_matrix");
  convolutionVars.imageUniformLocation = gl.getUniformLocation(convolutionVars.program, "u_image");
  convolutionVars.kernelUniformLocation = gl.getUniformLocation(convolutionVars.program, "u_kernel");
  convolutionVars.kernelWeightUniformLocation = gl.getUniformLocation(convolutionVars.program, "u_kernelWeight");

  // Set up square to render textures to
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

  // Create a vao to hold the attribute state for this program
  convolutionVars.vao = gl.createVertexArray();
  gl.bindVertexArray(convolutionVars.vao);

  gl.enableVertexAttribArray(positionAttributeLocation);
  size = 2;
  type = gl.FLOAT;
  normalise = false;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalise, stride, offset);

  // Set up buffer for texture coordinates
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,
  ]), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(texcoordAttributeLocation);
  size = 2;
  type = gl.FLOAT;
  normalise = true;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(texcoordAttributeLocation, size, type, normalise, stride, offset);

  // Create four textures and framebuffers (2 for front and 2 for back)
  for (let i = 0; i < 4; ++i) {
    const texture = createAndSetupTexture(gl, null);
    convolutionVars.textures.push(texture);

    const mipLevel = 0;
    const srcFormat = gl.RGBA;
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    const border = 0;
    const internalFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const data = null;

    gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat, width, height, border, srcFormat, srcType, data);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    convolutionVars.framebuffers.push(fbo);

    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, mipLevel);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function setTexture(gl, originalImageTexture, effectsToApply, textureUnit) {
  // Use the convolution program
  gl.useProgram(convolutionVars.program);
  gl.bindVertexArray(convolutionVars.vao);
  gl.activeTexture(gl.TEXTURE0 + textureUnit);

  gl.uniform1i(convolutionVars.imageUniformLocation, textureUnit);

  const kernels = { // Convolution kernels to choose from
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0,
    ],
    emboss: [
      -2, -1, 0,
      -1, 1, 1,
      0, 1, 2,
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
    sharpen: [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0,
    ],
    blur: [
      1, 1, 1,
      1, 1, 1,
      1, 1, 1,
    ]
  };

  // Resize the textures that will be used for image transformation to the correct width and height
  for (let texture of convolutionVars.textures.slice(textureUnit*2, textureUnit*2+2)) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }

  // Bind original texture
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // Apply the kernels
  let count = 0;
  for (let i = 0; i < effectsToApply.length; ++i) {
    // Bind the correct framebuffer. textureUnit*2 means that for frontTexture (unit 0), the first two framebuffers are used, and backTexture (unit 1), the third and fourth framebuffers are used.
    gl.bindFramebuffer(gl.FRAMEBUFFER, convolutionVars.framebuffers[count % 2 + textureUnit*2]);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Use the kernel on the texture
    drawEffect(kernels[effectsToApply[i]]);

    // Bind the texture, so that it can be used again if more effects are needed, and so that it can be used in the program if no effects are needed
    gl.bindTexture(gl.TEXTURE_2D, convolutionVars.textures[count % 2 + textureUnit*2]);
    ++count;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Clear the framebuffer, so that it renders to the canvas

  function drawEffect(kernel) {
    let primitiveType, offset, count;

    const projectionMatrix = m3.projection(1, 1, false);
    const kernelWeight = computeKernelWeight(kernel);

    // Set up the kernel, weight and matrix
    gl.uniform1fv(convolutionVars.kernelUniformLocation, kernel);
    gl.uniform1f(convolutionVars.kernelWeightUniformLocation, kernelWeight);
    gl.uniformMatrix3fv(convolutionVars.matrixUniformLocation, false, projectionMatrix);

    primitiveType = gl.TRIANGLES;
    offset = 0;
    count = 6 * 1;
    gl.drawArrays(primitiveType, offset, count);
  }
}

function computeKernelWeight(kernel) {
  let weight = kernel.reduce((acc, cur) => acc + cur, 0);
  if (weight <= 0) weight = 1;
  return weight;
}

export {setTexture, setUpConvolutionTextures};
