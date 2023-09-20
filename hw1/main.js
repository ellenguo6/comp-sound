var audioCtx;

const imageFiles = ["image1.png", "image2.png", "image3.png"];

const waveformSelect = document.getElementById("waveformSelect");
const applyButton = document.getElementById("applyButton");

const globalGainValue = 0.6;
const epsilon = 0.001;

const attackTransition = 0.05;
const attackTime = 0.01;
const attackGain = 0.5;

const decayTransition = 0.05;
const sustainGain = 0.3;

const releaseTransition = 0.1;

function displayRandomImage() {
  const randomIndex = Math.floor(Math.random() * imageFiles.length);
  const randomImage = imageFiles[randomIndex];

  const displayedImg = document.getElementById("displayedImg");
  displayedImg.src = "img/" + randomImage;

  const container = document.getElementById("imageContainer");
  const maxWidth = container.clientWidth - displayedImg.width;
  const maxHeight = container.clientHeight - displayedImg.height;
  const randomX = Math.floor(Math.random() * maxWidth);
  const randomY = Math.floor(Math.random() * maxHeight);

  displayedImg.style.left = randomX + "px";
  displayedImg.style.top = randomY + "px";
}

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

  activeOscillators = {};
  gainNodes = {};

  function keyDown(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
      displayRandomImage();
      playNote(key);
    }
  }

  function keyUp(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && activeOscillators[key]) {
      gainNode = gainNodes[key];
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, releaseTransition);

      delete activeOscillators[key];
      delete gainNodes[key];
    }
  }

  function playNote(key) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    const totalVoices = Object.keys(activeOscillators).length + 1;

    Object.values(gainNodes).forEach(function (gainNode) {
      gainNode.gain.setTargetAtTime(
        sustainGain / totalVoices,
        audioCtx.currentTime,
        epsilon
      );
    });

    osc.connect(gainNode).connect(globalGain);
    osc.frequency.setValueAtTime(
      keyboardFrequencyMap[key],
      audioCtx.currentTime
    );
    osc.type = waveformSelect.value; //choose your favorite waveform
    osc.start();

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

    activeOscillators[key] = osc;
    gainNodes[key] = gainNode;
  }
});
