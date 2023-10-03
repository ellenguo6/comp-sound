var audioCtx;

const waveformSelect = document.getElementById("waveformSelect");
const synthType = document.getElementById("synthType");
const sliderContainer = document.getElementById("sliderContainer");
const applyButton = document.getElementById("applyButton");

const globalGainValue = 0.5;
const epsilon = 0.001;

const attackTransition = 0.003;
const attackTime = 0.01;
const attackGain = 0.4;

const decayTransition = 0.003;
const sustainGain = 0.2;

const releaseTransition = 0.1;

document.addEventListener("DOMContentLoaded", function (event) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const keyboardFrequencyMap = {
    90: 261.625565300598634, //Z - C
    83: 277.182630976872096, //S - C#
    88: 293.66476791740756, //X - D
    68: 311.12698372208091, //D - D#
    67: 329.627556912869929, //C - E
    86: 349.228231433003884, //V - F
    71: 369.994422711634398, //G - F#
    66: 391.995435981749294, //B - G
    72: 415.304697579945138, //H - G#
    78: 440.0, //N - A
    74: 466.163761518089916, //J - A#
    77: 493.883301256124111, //M - B
    81: 523.251130601197269, //Q - C
    50: 554.365261953744192, //2 - C#
    87: 587.32953583481512, //W - D
    51: 622.253967444161821, //3 - D#
    69: 659.255113825739859, //E - E
    82: 698.456462866007768, //R - F
    53: 739.988845423268797, //5 - F#
    84: 783.990871963498588, //T - G
    54: 830.609395159890277, //6 - G#
    89: 880.0, //Y - A
    55: 932.327523036179832, //7 - A#
    85: 987.766602512248223, //U - B
  };
  window.addEventListener("keydown", keyDown, false);
  window.addEventListener("keyup", keyUp, false);

  const globalGain = audioCtx.createGain(); //this will control the volume of all notes
  globalGain.gain.setValueAtTime(globalGainValue, audioCtx.currentTime);
  globalGain.connect(audioCtx.destination);

  baseOscillators = {};
  lfoOscillators = {};
  additiveOscillators = {};
  amOscillators = {};
  fmOscillators = {};
  gainNodes = {};

  function keyDown(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && !baseOscillators[key]) {
      playNote(key);
      totalVoices = Object.keys(baseOscillators).length;
      createRandomImages(totalVoices);
    }
  }

  function keyUp(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && baseOscillators[key]) {
      gainNode = gainNodes[key];
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, releaseTransition);

      delete baseOscillators[key];
      delete lfoOscillators[key];
      delete additiveOscillators[key];
      delete amOscillators[key];
      delete fmOscillators[key];
      delete gainNodes[key];
    }
  }

  function playNote(key) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode).connect(globalGain);
    osc.frequency.setValueAtTime(
      keyboardFrequencyMap[key],
      audioCtx.currentTime
    );
    osc.type = waveformSelect.value;

    let totalVoices = 1;

    let lfo;
    if (synthType.value == "lfo") {
      lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.5;
      lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 8;
      lfo.connect(lfoGain).connect(osc.frequency);
      totalVoices += 1;
    }

    // additive
    let additiveOscs = [];
    if (synthType.value == "additive") {
      const numAdditiveOscillators = parseInt(
        document.getElementById("slider").value
      );
      for (let i = 0; i < numAdditiveOscillators; i++) {
        const o = audioCtx.createOscillator();
        additiveOscs.push(o);
        o.frequency.value = (i + 1) * keyboardFrequencyMap[key];
        o.connect(gainNode);
        o.type = waveformSelect.value;
      }
      totalVoices += numAdditiveOscillators;
    }

    // AM
    let amModulator;
    if (synthType.value == "AM") {
      amModulator = audioCtx.createOscillator();
      amModulator.frequency.value = parseInt(
        document.getElementById("slider").value
      );
      const depth = audioCtx.createGain();

      depth.gain.value = 0.5;

      amModulator.connect(depth).connect(gainNode);
      totalVoices += 1;
    }

    // FM
    let fmModulator;
    if (synthType.value == "FM") {
      fmModulator = audioCtx.createOscillator();

      modulationIndex = audioCtx.createGain();
      modulationIndex.gain.value = parseInt(
        document.getElementById("modIndexSlider").value
      );
      fmModulator.frequency.value = parseInt(
        document.getElementById("modFreqSlider").value
      );

      fmModulator.connect(modulationIndex);
      modulationIndex.connect(osc.frequency);
      totalVoices += 2;
    }

    totalVoices += Object.keys(baseOscillators).length;
    totalVoices += Object.keys(amOscillators).length;
    totalVoices += Object.keys(fmOscillators).length;
    for (const key in additiveOscillators) {
      if (additiveOscillators.hasOwnProperty(key)) {
        totalVoices += additiveOscillators[key].length;
      }
    }

    Object.values(gainNodes).forEach(function (gainNode) {
      gainNode.gain.setTargetAtTime(
        sustainGain / totalVoices,
        audioCtx.currentTime,
        epsilon
      );
    });

    osc.start();
    for (const o of additiveOscs) {
      o.start();
    }
    if (amModulator !== undefined) {
      amModulator.start();
      amOscillators[key] = amModulator;
    }
    if (fmModulator !== undefined) {
      fmModulator.start();
      fmOscillators[key] = fmModulator;
    }
    if (lfo !== undefined) {
      lfo.start();
      lfoOscillators[key] = lfo;
    }

    gainNode.gain.setValueAtTime(epsilon, audioCtx.currentTime);
    gainNode.gain.setTargetAtTime(
      attackGain / totalVoices,
      audioCtx.currentTime,
      attackTransition
    );
    gainNode.gain.setTargetAtTime(
      sustainGain / totalVoices,
      audioCtx.currentTime + attackTime,
      decayTransition
    );

    baseOscillators[key] = osc;
    additiveOscillators[key] = additiveOscs;
    gainNodes[key] = gainNode;
  }
});

const n = 7;

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to create and position random images
function createRandomImages(m) {
  const container = document.getElementById("imageContainer");

  for (let i = 1; i <= m; i++) {
    const img = document.createElement("img");
    img.src = `img/image${getRandomNumber(1, n)}.png`;
    img.classList.add("image");

    // Set random position within the container
    const x = getRandomNumber(0, container.clientWidth - 100);
    const y = getRandomNumber(0, container.clientHeight - 100);
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    container.appendChild(img);
  }
}

function clearImages() {
  const container = document.getElementById("imageContainer");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

const clearButton = document.getElementById("clearButton");
clearButton.addEventListener("click", clearImages);

synthType.addEventListener("change", function () {
  const selectedValue = synthType.value;

  // Remove any previously added sliders and labels
  sliderContainer.innerHTML = "";

  if (selectedValue === "additive") {
    createSlider("choose number of partials:", "slider", 1, 10);
  } else if (selectedValue === "AM") {
    createSlider("choose modulation frequency:", "slider", 1, 1000);
  } else if (selectedValue === "FM") {
    createSlider("Choose modulator frequency:", "modFreqSlider", 1, 1000);
    sliderContainer.appendChild(document.createElement("br"));
    createSlider("Choose index of modulation:", "modIndexSlider", 1, 1000);
  }
});

function createSlider(labelText, id, minValue, maxValue) {
  // Create and append a label for the slider
  const label = document.createElement("label");
  label.textContent = labelText;
  sliderContainer.appendChild(label);

  // Create and append a slider
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = minValue;
  slider.max = maxValue;
  slider.value = minValue; // Initialize with min value
  slider.id = id;
  sliderContainer.appendChild(slider);

  // Create and append a span element to display the selected value
  const valueDisplay = document.createElement("span");
  valueDisplay.id = "sliderValue";
  valueDisplay.textContent = slider.value;
  sliderContainer.appendChild(valueDisplay);

  // Add an input event listener to update the value display
  slider.addEventListener("input", function () {
    valueDisplay.textContent = slider.value;
  });
}
