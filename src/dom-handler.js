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
    properties.frontImage.src = URL.createObjectURL(this.files[0]);
  });

  const backImageInput = document.querySelector("#back-image");
  backImageInput.addEventListener("change", function() {
    properties.backImage.src = URL.createObjectURL(this.files[0]);
  });

  zSlider.dispatchEvent(new Event("input"));
  widthSlider.dispatchEvent(new Event("input"));
  heightSlider.dispatchEvent(new Event("input"));
}

export {handleDom};
