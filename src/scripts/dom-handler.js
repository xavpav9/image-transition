function handleDom(properties) {
  const canvas = document.querySelector("#c");
  const zSlider = document.querySelector("#z-slider");
  const zSliderOutput = document.querySelector(".z-slider > output");
  zSlider.addEventListener("input", evt => {
    zSliderOutput.textContent = zSlider.value;
    properties.startingZ = +zSlider.value;
  });


  const widthSlider = document.querySelector("#width-slider");
  const widthSliderOutput = document.querySelector(".width-slider > output");
  widthSlider.addEventListener("input", evt => {
    widthSliderOutput.textContent = widthSlider.value;
    canvas.style.width = widthSlider.value + "px";
  });


  const heightSlider = document.querySelector("#height-slider");
  const heightSliderOutput = document.querySelector(".height-slider > output");
  heightSlider.addEventListener("input", evt => {
    heightSliderOutput.textContent = heightSlider.value;
    canvas.style.height = heightSlider.value + "px";
  });


  const frontImageInput = document.querySelector("#front-image");
  frontImageInput.addEventListener("change", function() {
    properties.frontImageLoaded = false;
    properties.frontImage.src = URL.createObjectURL(this.files[0]);
  });


  const backImageInput = document.querySelector("#back-image");
  backImageInput.addEventListener("change", function() {
    properties.backImageLoaded = false;
    properties.backImage.src = URL.createObjectURL(this.files[0]);
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


  zSlider.dispatchEvent(new Event("input"));
  widthSlider.dispatchEvent(new Event("input"));
  heightSlider.dispatchEvent(new Event("input"));
  rotationSpeedSlider.dispatchEvent(new Event("input"));
  translationSpeedSlider.dispatchEvent(new Event("input"));
}

export {handleDom};
