function handleDom(properties) {
  const canvas = document.querySelector("#c");

  const previousDimensions = {
    setWidth: true,
    setHeight: true,
    maxWidth: 0,
    maxHeight: 0,
    width: 800,
    height: 500,
  }

  const frontImageInput = document.querySelector("#front-image");
  frontImageInput.addEventListener("change", function() {
    properties.frontImageLoaded = false;
    properties.frontImage.src = URL.createObjectURL(this.files[0]);
    properties.frontConvolutionJustApplied = true;
  });


  const backImageInput = document.querySelector("#back-image");
  backImageInput.addEventListener("change", function() {
    properties.backImageLoaded = false;
    properties.backImage.src = URL.createObjectURL(this.files[0]);
    properties.backConvolutionJustApplied = true;
  });


  const zSlider = document.querySelector("#z-slider");
  const zSliderOutput = document.querySelector(".z-slider > output");
  zSlider.addEventListener("input", evt => {
    zSliderOutput.textContent = zSlider.value;
    properties.startingZ = +zSlider.value;
  });


  const widthSlider = document.querySelector("#width-slider");
  const widthSliderOutput = document.querySelector(".width-slider > output");
  widthSlider.addEventListener("input", evt => {
    widthSliderOutput.textContent = `${widthSlider.value}px`;
    canvas.style.width = `${widthSlider.value}px`;

    if (previousDimensions.setWidth) {
      previousDimensions.width = widthSlider.value;
    } else {
      previousDimensions.setWidth = true;
    }

    setTimeout(() => { // Needs a slight delay so as to prevent the texture being drawn wrong
      properties.frontConvolutionJustApplied = true;
      properties.backConvolutionJustApplied = true;
    }, 1);
  });


  const heightSlider = document.querySelector("#height-slider");
  const heightSliderOutput = document.querySelector(".height-slider > output");
  heightSlider.addEventListener("input", evt => {
    heightSliderOutput.textContent = `${heightSlider.value}px`;
    canvas.style.height = `${heightSlider.value}px`;

    if (previousDimensions.setHeight) {
      previousDimensions.height = heightSlider.value;
    } else {
      previousDimensions.setHeight = true;
    }

    setTimeout(() => { // Needs a slight delay so as to prevent the texture being drawn wrong
      properties.frontConvolutionJustApplied = true;
      properties.backConvolutionJustApplied = true;
    }, 1);
  });


  const rotationSpeedSlider = document.querySelector("#rotation-speed-slider");
  const rotationSpeedOutput = document.querySelector(".rotation-speed-slider > output");
  rotationSpeedSlider.addEventListener("input", function() {
    rotationSpeedOutput.textContent = rotationSpeedSlider.value;
    properties.rotationSpeed = +rotationSpeedSlider.value * Math.PI / 180;
  });


  const translationSpeedSlider = document.querySelector("#translation-speed-slider");
  const translationSpeedOutput = document.querySelector(".translation-speed-slider > output");
  translationSpeedSlider.addEventListener("input", function() {
    translationSpeedOutput.textContent = translationSpeedSlider.value;
    properties.translationSpeed = -+translationSpeedSlider.value;
  });


  const thicknessSlider = document.querySelector("#thickness-slider");
  const thicknessOutput = document.querySelector(".thickness-slider > output");
  thicknessSlider.addEventListener("input", function() {
    thicknessOutput.textContent = thicknessSlider.value;
    properties.thickness = +thicknessSlider.value;
  });


  const backBlur = document.querySelector("#back-blur");
  const frontBlur = document.querySelector("#front-blur");
  const backSharpen = document.querySelector("#back-sharpen");
  const frontSharpen = document.querySelector("#front-sharpen");
  const backEdgeDetect = document.querySelector("#back-edge-detect");
  const frontEdgeDetect = document.querySelector("#front-edge-detect");
  const backEmboss = document.querySelector("#back-emboss");
  const frontEmboss = document.querySelector("#front-emboss");

  const backEffects = [backBlur, backSharpen, backEdgeDetect, backEmboss];
  const frontEffects = [frontBlur, frontSharpen, frontEdgeDetect, frontEmboss];

  backEffects.concat(frontEffects).forEach(effect => {
    effect.addEventListener("input", evt => {
      if (effect.dataset.side === "back") {
        properties.backConvolutionJustApplied = true;
        properties.backImageEffects = [];
        backEffects.forEach(currentEffect => {
          for (let i = 0; i < currentEffect.value; ++i) {
            properties.backImageEffects.push(currentEffect.dataset.effect);
          }
        });
      } else {
        properties.frontConvolutionJustApplied = true;
        properties.frontImageEffects = [];
        frontEffects.forEach(currentEffect => {
          for (let i = 0; i < currentEffect.value; ++i) {
            properties.frontImageEffects.push(currentEffect.dataset.effect);
          }
        });
      }
    });
  });


  window.addEventListener("resize", evt => {
    // 50 is for the padding + any extra (e.g. border)
    const widthMax = Math.min(800, window.innerWidth - 50)
    const heightMax = Math.min(500, window.innerHeight - 50);

    // When resizing, if it resizes smaller, it ensures that the canvas size is smaller than this.
    // However, if it resizes bigger, it will try to get back to the previous size set by the user. 
    // For example, if the canvas width was 500, then the max got set to 200, but then back to 700, the final width of the canvas would be 500, but if it only go set back up to 400, it would be 400.
    
    let isPreviousWidth = false, isPreviousHeight = false;

    if (+widthSlider.value < previousDimensions.width) isPreviousWidth = true;
    if (+heightSlider.value < previousDimensions.height) isPreviousHeight = true;

    widthSlider.setAttribute("max", `${widthMax}`);
    heightSlider.setAttribute("max", `${heightMax}`);

    if (isPreviousWidth) {
      if (previousDimensions.width > widthMax) widthSlider.value = `${widthMax}`;
      else widthSlider.value = `${previousDimensions.width}`;
    }
    if (isPreviousHeight) {
      if (previousDimensions.height > heightMax) heightSlider.value = `${heightMax}`;
      else heightSlider.value = `${previousDimensions.height}`;
    }

    // Do not set this new width/height as the previous dimensions set by the user
    previousDimensions.setWidth = false;
    widthSlider.dispatchEvent(new Event("input"));

    previousDimensions.setHeight = false;
    heightSlider.dispatchEvent(new Event("input"));

    previousDimensions.maxWidth = widthMax;
    previousDimensions.maxHeight = heightMax;
  });




  zSlider.dispatchEvent(new Event("input"));
  widthSlider.dispatchEvent(new Event("input"));
  heightSlider.dispatchEvent(new Event("input"));
  rotationSpeedSlider.dispatchEvent(new Event("input"));
  translationSpeedSlider.dispatchEvent(new Event("input"));
  thicknessSlider.dispatchEvent(new Event("input"));

  backBlur.dispatchEvent(new Event("input"));
  frontBlur.dispatchEvent(new Event("input"));
  backSharpen.dispatchEvent(new Event("input"));
  frontSharpen.dispatchEvent(new Event("input"));
  backEdgeDetect.dispatchEvent(new Event("input"));
  frontEdgeDetect.dispatchEvent(new Event("input"));
  backEmboss.dispatchEvent(new Event("input"));
  frontEmboss.dispatchEvent(new Event("input"));
  window.dispatchEvent(new Event("resize"));
}

function enableSpeedChanges() {
  const zSlider = document.querySelector("#z-slider");
  const widthSlider = document.querySelector("#width-slider");
  const heightSlider = document.querySelector("#height-slider");
  const thicknessSlider = document.querySelector("#thickness-slider");
  const rotationSpeedSlider = document.querySelector("#rotation-speed-slider");
  const translationSpeedSlider = document.querySelector("#translation-speed-slider");

  zSlider.removeAttribute("disabled");
  widthSlider.removeAttribute("disabled");
  heightSlider.removeAttribute("disabled");
  thicknessSlider.removeAttribute("disabled");
  rotationSpeedSlider.removeAttribute("disabled");
  translationSpeedSlider.removeAttribute("disabled");
}

function disableSpeedChanges() {
  const zSlider = document.querySelector("#z-slider");
  const widthSlider = document.querySelector("#width-slider");
  const heightSlider = document.querySelector("#height-slider");
  const thicknessSlider = document.querySelector("#thickness-slider");
  const rotationSpeedSlider = document.querySelector("#rotation-speed-slider");
  const translationSpeedSlider = document.querySelector("#translation-speed-slider");

  zSlider.setAttribute("disabled", "true");
  widthSlider.setAttribute("disabled", "true");
  heightSlider.setAttribute("disabled", "true");
  thicknessSlider.setAttribute("disabled", "true");
  rotationSpeedSlider.setAttribute("disabled", "true");
  translationSpeedSlider.setAttribute("disabled", "true");
}

export {handleDom, enableSpeedChanges, disableSpeedChanges};
