// Synthesis copied from utahbug/PrimarySongs, 610a1eb02cd3b68941919c2e30c0c2de07461827,
// script-v528.js: playMetronomeClick and scheduleMetronomeTone (lines 9022–9131).
// Only context/selection injection and tracked voice disposal differ; recipes and envelopes are unchanged.
export const metronomeSounds={original:"Current click (original)",wood:"Wood block",classic:"Classic click",pulse:"Soft pulse",bell:"Bell",marimba:"Marimba",bubble:"Bubble",water:"Water drop"};
export function primaryMetronomeTones(sound, time, isAccent, scheduleMetronomeTone) {
  if (sound === "classic") {
    scheduleMetronomeTone(time, {
      type: "square",
      frequency: isAccent ? 1250 : 900,
      gain: isAccent ? 0.24 : 0.15,
      duration: 0.045
    });
    return;
  }
  if (sound === "pulse") {
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency: isAccent ? 520 : 390,
      gain: isAccent ? 0.24 : 0.16,
      duration: 0.11,
      endFrequency: isAccent ? 440 : 330
    });
    return;
  }
  if (sound === "bell") {
    const frequency = isAccent ? 880 : 660;
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency,
      gain: isAccent ? 0.22 : 0.15,
      duration: 0.24
    });
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency: frequency * 2.01,
      gain: isAccent ? 0.055 : 0.038,
      duration: 0.18
    });
    return;
  }
  if (sound === "marimba") {
    const frequency = isAccent ? 523.25 : 392;
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency,
      gain: isAccent ? 0.3 : 0.21,
      duration: 0.17,
      endFrequency: frequency * 0.92
    });
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency: frequency * 3.98,
      gain: isAccent ? 0.045 : 0.03,
      duration: 0.055,
      endFrequency: frequency * 3.6
    });
    return;
  }
  if (sound === "bubble") {
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency: isAccent ? 270 : 220,
      gain: isAccent ? 0.27 : 0.19,
      duration: 0.13,
      endFrequency: isAccent ? 650 : 520
    });
    return;
  }
  if (sound === "water") {
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency: isAccent ? 1120 : 900,
      gain: isAccent ? 0.24 : 0.17,
      duration: 0.16,
      endFrequency: isAccent ? 610 : 480
    });
    scheduleMetronomeTone(time, {
      type: "sine",
      frequency: isAccent ? 1680 : 1350,
      gain: isAccent ? 0.035 : 0.024,
      duration: 0.085,
      endFrequency: isAccent ? 920 : 720
    });
    return;
  }
  scheduleMetronomeTone(time, {
    type: "triangle",
    frequency: isAccent ? 560 : 430,
    gain: isAccent ? 0.34 : 0.23,
    duration: 0.075,
    endFrequency: isAccent ? 190 : 155
  });
}

export function scheduleMetronomeTone(audioContext, voices, time, options) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const duration = options.duration || 0.06;
  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(options.frequency, time);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, time + duration);
  }
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(options.gain, time + Math.min(0.005, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  const voice={dispose(){oscillator.onended=null;try{oscillator.stop();}catch{}oscillator.disconnect();gain.disconnect();voices.delete(voice);}};
  voices.add(voice);oscillator.onended=()=>voice.dispose();
  oscillator.start(time);
  oscillator.stop(time + duration + 0.01);
}
