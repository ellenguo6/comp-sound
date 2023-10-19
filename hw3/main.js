var audioCtxCreek;
var audioCtxSound = new AudioContext();
var globalGain;
var noiseEnv;
var feedbackDelay;
const epsilon = 0.001;
const startButton = document.getElementById("startButton");
const soundType = document.getElementById("sound");

startButton.addEventListener(
  "click",
  function () {
    if (document.getElementById("sound").value == "babblingCreek") {
      if (!audioCtxCreek) {
        initCreek();
      } else if (audioCtxCreek.state === "suspended") {
        audioCtxCreek.resume();
      } else if (audioCtxCreek.state === "running") {
        audioCtxCreek.suspend();
      }
    } else {
      initSound();
    }
    return;
  },
  false
);

soundType.addEventListener("change", function () {
  startButton.textContent = "add ball";
});

let createBrownNoise = function (actx) {
  var bufferSize = 10 * actx.sampleRate,
    noiseBuffer = actx.createBuffer(1, bufferSize, actx.sampleRate),
    output = noiseBuffer.getChannelData(0);

  var lastOut = 0;
  for (var i = 0; i < bufferSize; i++) {
    var brown = Math.random() * 2 - 1;

    output[i] = (lastOut + 0.02 * brown) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }

  var brownNoise = actx.createBufferSource();
  brownNoise.buffer = noiseBuffer;
  brownNoise.loop = true;
  brownNoise.start(0);

  return brownNoise;
};

let initCreek = function () {
  audioCtxCreek = new AudioContext();

  globalGain = audioCtxCreek.createGain();
  globalGain.gain.value = 0.1;
  globalGain.connect(audioCtxCreek.destination);

  var lpf1 = audioCtxCreek.createBiquadFilter();
  lpf1.type = "lowpass";
  lpf1.frequency.value = 400;

  var lpf2 = audioCtxCreek.createBiquadFilter();
  lpf2.type = "lowpass";
  lpf2.frequency.value = 14;

  var rhpf = audioCtxCreek.createBiquadFilter();
  rhpf.type = "highpass";
  rhpf.Q.value = 33.33;
  rhpf.frequency.value = 500;

  var gain1 = audioCtxCreek.createGain();
  gain1.gain.value = 1500;

  var brownNoise1 = createBrownNoise(audioCtxCreek);
  var brownNoise2 = createBrownNoise(audioCtxCreek);

  brownNoise2.connect(lpf2).connect(gain1).connect(rhpf.frequency);
  brownNoise1.connect(lpf1).connect(rhpf).connect(globalGain);
};

let initSound = function () {
  globalGain = audioCtxSound.createGain();
  globalGain.gain.value = 0.2;
  globalGain.connect(audioCtxSound.destination);

  function playBounceSound(factor) {
    const osc = audioCtxSound.createOscillator();
    osc.type = "sine";
    const gainNode = audioCtxSound.createGain();
    gainNode.connect(globalGain);
    osc.frequency.setValueAtTime(110, audioCtxSound.currentTime);

    const modulator = audioCtxSound.createOscillator();
    modulator.type = "sine";
    const modulationIndex = audioCtxSound.createGain();

    modulator.connect(modulationIndex);
    modulationIndex.connect(osc.frequency);
    osc.connect(gainNode);

    osc.start(audioCtxSound.currentTime);
    modulator.start(audioCtxSound.currentTime);
    osc.stop(audioCtxSound.currentTime + 0.2);
    modulator.stop(audioCtxSound.currentTime + 0.2);

    gainNode.gain.exponentialRampToValueAtTime(
      0.8 * factor,
      audioCtxSound.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      epsilon,
      audioCtxSound.currentTime + 0.3
    );

    modulationIndex.gain.setValueAtTime(0, audioCtxSound.currentTime);
    modulationIndex.gain.exponentialRampToValueAtTime(
      600 * factor,
      audioCtxSound.currentTime + 0.01
    );
    modulationIndex.gain.exponentialRampToValueAtTime(
      epsilon,
      audioCtxSound.currentTime + 0.2
    );

    modulator.frequency.setValueAtTime(0, audioCtxSound.currentTime);
    modulator.frequency.exponentialRampToValueAtTime(
      500 * factor,
      audioCtxSound.currentTime + 0.01
    );
    modulator.frequency.exponentialRampToValueAtTime(
      epsilon,
      audioCtxSound.currentTime + 0.2
    );
  }

  let intervalTime = 800;
  let factor = 1;
  function bounce() {
    playBounceSound(factor);
    intervalTime *= 0.85;
    factor *= 0.9;
    if (intervalTime > 50) {
      setTimeout(bounce, intervalTime);
    }
  }
  bounce();
};
