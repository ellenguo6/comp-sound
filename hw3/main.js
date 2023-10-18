var audioCtx;
var globalGain;
var noiseEnv;
var feedbackDelay;
const startButton = document.getElementById("startButton");

startButton.addEventListener(
  "click",
  function () {
    if (!audioCtx) {
      startButton.value = "Stop";
      initAudio();
      return;
    } else if (audioCtx.state === "suspended") {
      audioCtx.resume();
      startButton.value = "Stop";
    } else if (audioCtx.state === "running") {
      audioCtx.suspend();
      startButton.value = "Start";
    }
  },
  false
);

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

let initAudio = function () {
  audioCtx = new AudioContext();
  globalGain = audioCtx.createGain();
  globalGain.gain.value = 0.1;
  globalGain.connect(audioCtx.destination);

  var lpf1 = audioCtx.createBiquadFilter();
  lpf1.type = "lowpass";
  lpf1.frequency.value = 400;

  var lpf2 = audioCtx.createBiquadFilter();
  lpf2.type = "lowpass";
  lpf2.frequency.value = 14;

  var rhpf = audioCtx.createBiquadFilter();
  rhpf.type = "highpass";
  rhpf.Q.value = 33.33;
  rhpf.frequency.value = 500;

  var gain1 = audioCtx.createGain();
  gain1.gain.value = 1500;

  var brownNoise1 = createBrownNoise(audioCtx);
  var brownNoise2 = createBrownNoise(audioCtx);

  brownNoise2.connect(lpf2).connect(gain1).connect(rhpf.frequency);
  brownNoise1.connect(lpf1).connect(rhpf).connect(globalGain);
};
