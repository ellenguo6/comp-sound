var audioCtx;

const waveformSelect = document.getElementById("waveformSelect");
const applyButton = document.getElementById("applyButton");

const globalGainValue = 0.6;
const epsilon = 0.001;

const attackTransition = 0.003;
const attackTime = 0.01;
const attackGain = 0.5;

const decayTransition = 0.003;
const sustainGain = 0.3;

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
  additiveOscillators = {};
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
      delete additiveOscillators[key];
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
    osc.start();

    const numAdditiveOscillators = 3;
    const additiveOscs = [];
    for (let i = 0; i < numAdditiveOscillators; i++) {
      const o = audioCtx.createOscillator();
      additiveOscs.push(o);
      o.frequency.value = (i + 1) * keyboardFrequencyMap[key];
      o.connect(gainNode);
      o.type = waveformSelect.value;
      o.start();
    }

    const totalVoices = Object.keys(baseOscillators).length + 1;

    Object.values(gainNodes).forEach(function (gainNode) {
      gainNode.gain.setTargetAtTime(
        sustainGain / totalVoices,
        audioCtx.currentTime,
        epsilon
      );
    });

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
    additiveOscs[key] = additiveOscs;
    gainNodes[key] = gainNode;
  }
});

const n = 3;

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
