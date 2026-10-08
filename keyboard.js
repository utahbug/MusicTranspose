import {createDisplaySettings} from './display-settings.js';
// Ported from utahbug/PrimarySongs, commit 610a1eb (script-v528.js).
// Keyboard/guide algorithms and acoustic recipes stay separate from Score playback.
export function createKeyboardWorkspace({onHome}) {
const workspace = document.getElementById('keyboard-view');
const el = Object.fromEntries([...workspace.querySelectorAll('[id]')].map(node => [node.id,node]));
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const state = {piano:{sound:'grand-piano',volume:.58,transpose:0,audioContext:null,masterGain:null,compressor:null,voices:new Map(),pointerNotes:new Map(),pointerTokens:new Map()}};
const PIANO_SOUND_LABELS = {'grand-piano':'Grand piano','electric-piano':'Electric piano',bell:'Bell'};
const settingsKey = 'music-transpose-keyboard-v1';
const allVoices = new Set(), timers = new Map();
let generation = 0;
function schedule(callback,delay,cancel) { const id=setTimeout(() => {timers.delete(id);callback();},delay);timers.set(id,cancel);return id; }
function savePianoSettings() {const {sound,volume,transpose}=state.piano;try{localStorage.setItem(settingsKey,JSON.stringify({sound,volume,transpose}));}catch{}}
try {const saved=JSON.parse(localStorage.getItem(settingsKey)||'{}');if(Object.hasOwn(PIANO_SOUND_LABELS,saved.sound))state.piano.sound=saved.sound;for(const [key,min,max] of [['volume',0,1],['transpose',-6,6]])if(Number.isFinite(saved[key]))state.piano[key]=clamp(key==='transpose'?Math.round(saved[key]):saved[key],min,max);}catch{}
const PIANO_CHORDS = {
  major: { intervals: [0, 4, 7], use: "Major sounds bright and settled. It is the basic home sound in many songs." },
  minor: { intervals: [0, 3, 7], use: "Minor sounds reflective or emotional and often provides contrast to major chords." },
  diminished: { intervals: [0, 3, 6], use: "Diminished creates tension and commonly connects two nearby chords." },
  dominant7: { intervals: [0, 4, 7, 10], use: "Dominant 7th strongly wants to resolve home. It is central to blues and common as V7 in country." },
  major7: { intervals: [0, 4, 7, 11], use: "Major 7th adds a warm, polished color often heard in jazz and ballads." },
  minor7: { intervals: [0, 3, 7, 10], use: "Minor 7th is mellow and is the ii chord in many jazz ii–V–I progressions." },
  diminished7: { intervals: [0, 3, 6, 9], use: "Diminished 7th creates strong suspense and works well as a passing chord." },
  halfDiminished: { intervals: [0, 3, 6, 10], use: "Half-diminished is common as the ii chord in minor-key jazz progressions." },
  sus2: { intervals: [0, 2, 7], use: "Suspended 2nd sounds open and modern before resolving to major or minor." },
  sus4: { intervals: [0, 5, 7], use: "Suspended 4th creates gentle tension that often resolves down to a major chord." },
  augmented: { intervals: [0, 4, 8], use: "Augmented sounds unsettled and can lead upward into the next chord." },
  sixth: { intervals: [0, 4, 7, 9], use: "The 6th adds warmth without the stronger pull of a 7th; useful in country, jazz, and older popular music." },
  ninth: { intervals: [0, 2, 4, 7, 10], use: "The 9th expands a dominant 7th with extra color, especially in blues, funk, and jazz." }
};
const PIANO_STYLE_GUIDES = {
  hymn: {
    intro: "A familiar, settled sound. Move away from the home chord, then return to it.",
    chordType: "major", scaleType: "major", scaleLabel: "Major",
    chords: [[0, "major", "I · Home"], [5, "major", "IV · Away"], [7, "dominant7", "V7 · Leads home"], [0, "major", "I · Home"]]
  },
  country: {
    intro: "Start with three dependable chords. The dominant 7th gives the return home extra pull.",
    chordType: "major", scaleType: "majorPentatonic", scaleLabel: "Major pentatonic",
    chords: [[0, "major", "I"], [5, "major", "IV"], [7, "dominant7", "V7"], [0, "major", "I"]]
  },
  blues: {
    intro: "Use dominant 7th chords for the progression and the Blues scale for melody or improvising.",
    chordType: "dominant7", scaleType: "blues", scaleLabel: "Blues",
    chords: [[0, "dominant7", "I7"], [5, "dominant7", "IV7"], [7, "dominant7", "V7"], [0, "dominant7", "I7"]]
  },
  jazz: {
    intro: "Try the common ii–V–I movement: mellow minor 7th, tense dominant 7th, then a warm major 7th home.",
    chordType: "major7", scaleType: "dorian", scaleLabel: "Dorian over ii; Mixolydian over V; Major over I",
    chords: [[2, "minor7", "ii7", "dorian"], [7, "dominant7", "V7", "mixolydian"], [0, "major7", "Imaj7", "major"]]
  },
  pop: {
    intro: "These four chords create a familiar progression used in many popular songs.",
    chordType: "major", scaleType: "majorPentatonic", scaleLabel: "Major or major pentatonic",
    chords: [[0, "major", "I"], [7, "major", "V"], [9, "minor", "vi"], [5, "major", "IV"]]
  }
};
const PIANO_CHORD_SUFFIXES = {
  major: "", minor: "m", dominant7: "7", major7: "maj7", minor7: "m7"
};
const PIANO_SCALES = {
  major: { intervals: [0, 2, 4, 5, 7, 9, 11, 12], label: "Major", use: "Bright and familiar; common in hymns, folk music, and popular songs." },
  naturalMinor: { intervals: [0, 2, 3, 5, 7, 8, 10, 12], label: "Natural minor", use: "Reflective or dramatic; the basic minor-scale pattern." },
  majorPentatonic: { intervals: [0, 2, 4, 7, 9, 12], label: "Major pentatonic", use: "Open and friendly; useful in folk, country, and simple improvisation." },
  minorPentatonic: { intervals: [0, 3, 5, 7, 10, 12], label: "Minor pentatonic", use: "Flexible and expressive; widely used in rock, blues, and improvisation." },
  blues: { intervals: [0, 3, 5, 6, 7, 10, 12], label: "Blues", use: "Adds the distinctive blue note between the fourth and fifth." },
  dorian: { intervals: [0, 2, 3, 5, 7, 9, 10, 12], label: "Dorian", use: "A minor sound with a brighter sixth; common over minor 7th chords in jazz, funk, and modal music." },
  mixolydian: { intervals: [0, 2, 4, 5, 7, 9, 10, 12], label: "Mixolydian", use: "A major sound with a lowered seventh; useful over dominant 7th chords in blues, jazz, rock, and country." },
  chromatic: { intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], label: "Chromatic", use: "Uses every neighboring note; helpful for fingering, warmups, and hearing half steps." }
};
const PIANO_NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const KEY_CHANGE_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const KEY_SIGNATURES = [
  { count: 0, type: "", label: "No sharps or flats" },
  { count: 5, type: "flat", label: "5 flats: B♭, E♭, A♭, D♭, G♭" },
  { count: 2, type: "sharp", label: "2 sharps: F♯, C♯" },
  { count: 3, type: "flat", label: "3 flats: B♭, E♭, A♭" },
  { count: 4, type: "sharp", label: "4 sharps: F♯, C♯, G♯, D♯" },
  { count: 1, type: "flat", label: "1 flat: B♭" },
  { count: 6, type: "flat", label: "6 flats: B♭, E♭, A♭, D♭, G♭, C♭" },
  { count: 1, type: "sharp", label: "1 sharp: F♯" },
  { count: 4, type: "flat", label: "4 flats: B♭, E♭, A♭, D♭" },
  { count: 3, type: "sharp", label: "3 sharps: F♯, C♯, G♯" },
  { count: 2, type: "flat", label: "2 flats: B♭, E♭" },
  { count: 5, type: "sharp", label: "5 sharps: F♯, C♯, G♯, D♯, A♯" }
];
const keyboardKeyChange = { steps: 0 };
const PIANO_KEY_NAMES = ["C", "C♯ / D♭", "D", "D♯ / E♭", "E", "F", "F♯ / G♭", "G", "G♯ / A♭", "A", "A♯ / B♭", "B"];

function renderPiano() {
  if (el.keyboardSound) el.keyboardSound.value = state.piano.sound;
  if (el.keyboardVolume) {
    const keyboardVolumePercent = Math.round(state.piano.volume * 100);
    el.keyboardVolume.value = String(keyboardVolumePercent);
    el.keyboardVolume.style.setProperty("--volume-level", `${keyboardVolumePercent}%`);
  }
  if (el.keyboardTransposeValue) el.keyboardTransposeValue.value = state.piano.transpose > 0 ? `+${state.piano.transpose}` : String(state.piano.transpose);
  if (el.keyboardTransposeDown) el.keyboardTransposeDown.disabled = state.piano.transpose <= -6;
  if (el.keyboardTransposeUp) el.keyboardTransposeUp.disabled = state.piano.transpose >= 6;
  if (el.keyboardSoundStatus) {
    const soundingC = PIANO_NOTE_NAMES[(state.piano.transpose + 120) % 12];
    el.keyboardSoundStatus.textContent = `${PIANO_SOUND_LABELS[state.piano.sound]} · Transpose ${state.piano.transpose > 0 ? `+${state.piano.transpose}` : state.piano.transpose} · C sounds ${soundingC}`;
  }
  if (state.piano.masterGain && state.piano.audioContext) {
    state.piano.masterGain.gain.setTargetAtTime(state.piano.volume, state.piano.audioContext.currentTime, 0.015);
  }
}
function setupKeyboardUi() {
  el.keyboardSound.innerHTML = Object.entries(PIANO_SOUND_LABELS).map(([value,label]) => `<option value="${value}">${label}</option>`).join("");
  const whiteMidis = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
  const blackKeys = [
    [61, 1], [63, 2], [66, 4], [68, 5], [70, 6],
    [73, 8], [75, 9], [78, 11], [80, 12], [82, 13]
  ];
  const whiteWrap = document.createElement("div");
  whiteWrap.className = "keyboard-white-keys";
  whiteMidis.forEach((midi) => whiteWrap.appendChild(createKeyboardKey(midi, "keyboard-white")));
  el.realKeyboard.replaceChildren(whiteWrap);
  blackKeys.forEach(([midi, boundary]) => {
    const key = createKeyboardKey(midi, "keyboard-black");
    key.style.setProperty("--key-x", `${(boundary / whiteMidis.length) * 100}%`);
    el.realKeyboard.appendChild(key);
  });
}

function createKeyboardKey(midi, keyClass) {
  const key = document.createElement("button");
  const pitchClass = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const accessibleNames = ["C", "C sharp", "D", "D sharp", "E", "F", "F sharp", "G", "G sharp", "A", "A sharp", "B"];
  const displayNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  key.type = "button";
  key.className = `keyboard-key ${keyClass}`;
  key.dataset.midi = String(midi);
  key.setAttribute("aria-label", `${accessibleNames[pitchClass]}${octave}`);
  key.innerHTML = `<span>${displayNames[pitchClass]}</span>`;
  return key;
}

function renderPianoChordGuide() {
  if (!el.pianoChordRoot || !el.pianoChordType) return;
  const root = Number(el.pianoChordRoot.value) || 0;
  const chord = PIANO_CHORDS[el.pianoChordType.value] || PIANO_CHORDS.major;
  const chordMidis = new Set(chord.intervals.map((interval) => 60 + root + interval));
  workspace.querySelectorAll(".keyboard-key").forEach((button) => {
    button.classList.toggle("chord-highlight", chordMidis.has(Number(button.dataset.midi)));
  });
  el.pianoChordUse.textContent = chord.use;
  const chordTypeLabel = el.pianoChordType.selectedOptions[0]?.textContent || "Chord";
  const notes = chord.intervals.map((interval) => PIANO_KEY_NAMES[(root + interval) % 12]);
  el.pianoChordNotes.innerHTML = `<strong>${PIANO_NOTE_NAMES[root]} ${chordTypeLabel}</strong><span>Play: ${notes.join(" · ")}</span>`;
  const fourth = (root + 5) % 12;
  const fifth = (root + 7) % 12;
  const relativeMinor = (root + 9) % 12;
  el.pianoChordPartners.innerHTML = `
    <strong>Often works in ${PIANO_NOTE_NAMES[root]} major</strong>
    <span>${PIANO_NOTE_NAMES[root]} · ${PIANO_NOTE_NAMES[fourth]} · ${PIANO_NOTE_NAMES[fifth]} · ${PIANO_NOTE_NAMES[relativeMinor]}m</span>
  `;
  el.pianoChordFamily.innerHTML = `
    <span><strong>${PIANO_NOTE_NAMES[root]}</strong>I · Home</span>
    <span><strong>${PIANO_NOTE_NAMES[fourth]}</strong>IV · Away</span>
    <span><strong>${PIANO_NOTE_NAMES[fifth]}</strong>V · Leads home</span>
    <span><strong>${PIANO_NOTE_NAMES[relativeMinor]}m</strong>vi · Softer</span>
  `;
  renderPianoStyleGuide();
}

function applyPianoStyleGuide() {
  const guide = PIANO_STYLE_GUIDES[el.pianoStyle?.value];
  if (guide) {
    if (!el.pianoStyle.dataset.homeRoot) el.pianoStyle.dataset.homeRoot = el.pianoChordRoot.value;
    el.pianoChordType.value = guide.chordType;
    el.scaleRoot.value = el.pianoStyle.dataset.homeRoot;
    el.scaleType.value = guide.scaleType;
  } else {
    delete el.pianoStyle.dataset.homeRoot;
  }
  renderPianoChordGuide();
}

function handlePianoChordRootChange() {
  if (PIANO_STYLE_GUIDES[el.pianoStyle?.value]) {
    el.pianoStyle.dataset.homeRoot = el.pianoChordRoot.value;
    el.scaleRoot.value = el.pianoChordRoot.value;
  }
  renderPianoChordGuide();
}

function renderPianoStyleGuide() {
  if (!el.pianoStyle || !el.pianoStyleRecipe) return;
  const guide = PIANO_STYLE_GUIDES[el.pianoStyle.value];
  el.pianoStyleRecipe.hidden = !guide;
  if (!guide) {
    el.pianoStyleRecipe.replaceChildren();
    return;
  }
  const home = Number(el.pianoStyle.dataset.homeRoot ?? el.pianoChordRoot.value) || 0;
  const chordButtons = guide.chords.map(([offset, type, role, scaleType]) => {
    const root = (home + offset) % 12;
    const suffix = PIANO_CHORD_SUFFIXES[type] ?? "";
    const scaleAttribute = scaleType ? ` data-style-scale="${scaleType}"` : "";
    return `<button type="button" data-style-root="${root}" data-style-type="${type}"${scaleAttribute}><strong>${PIANO_NOTE_NAMES[root]}${suffix}</strong><span>${role}</span></button>`;
  }).join("");
  el.pianoStyleRecipe.innerHTML = `
    <div><strong>Try this first</strong></div>
    <div class="piano-style-chords">${chordButtons}</div>
    <p><strong>Scale:</strong> ${guide.scaleLabel}</p>
  `;
}

function handlePianoStyleRecipeClick(event) {
  const button = event.target.closest("[data-style-root][data-style-type]");
  if (!button) return;
  el.pianoChordRoot.value = button.dataset.styleRoot;
  el.pianoChordType.value = button.dataset.styleType;
  if (button.dataset.styleScale) {
    el.scaleRoot.value = button.dataset.styleRoot;
    el.scaleType.value = button.dataset.styleScale;
  }
  renderPianoChordGuide();
  playPianoGuideChord();
}

function showKeyboardGuide(guide) {
  stopAllPianoVoices();
  const tabs = [el.chordGuideTab, el.keyChangeTab, el.scaleGuideTab];
  tabs.forEach((tab,index) => tab.tabIndex = index === ["chord","key","scale"].indexOf(guide) ? 0 : -1);
  const showKeyChanges = guide === "key";
  const showScales = guide === "scale";
  const showChords = !showKeyChanges && !showScales;
  el.pianoChordGuide.hidden = !showChords;
  el.keyChangeGuide.hidden = !showKeyChanges;
  el.scaleGuide.hidden = !showScales;
  el.chordGuideTab.classList.toggle("selected", showChords);
  el.keyChangeTab.classList.toggle("selected", showKeyChanges);
  el.scaleGuideTab.classList.toggle("selected", showScales);
  el.chordGuideTab.setAttribute("aria-selected", String(showChords));
  el.keyChangeTab.setAttribute("aria-selected", String(showKeyChanges));
  el.scaleGuideTab.setAttribute("aria-selected", String(showScales));
  if (showChords) renderPianoChordGuide();
  if (showKeyChanges) renderKeyChangeGuide();
  if (showScales) renderPianoScaleGuide();
  if (showKeyChanges) {
    workspace.querySelectorAll(".keyboard-key").forEach((button) => {
      button.classList.remove("chord-highlight", "game-preview");
    });
  }
}

function renderPianoScaleGuide() {
  if (!el.scaleRoot || !el.scaleType || !el.scaleResult || !el.scaleTipText) return;
  const root = Number(el.scaleRoot.value) || 0;
  const scale = PIANO_SCALES[el.scaleType.value] || PIANO_SCALES.major;
  const scaleMidis = new Set(scale.intervals.map((interval) => 60 + root + interval));
  workspace.querySelectorAll(".keyboard-key").forEach((button) => {
    button.classList.toggle("chord-highlight", scaleMidis.has(Number(button.dataset.midi)));
    button.classList.remove("game-preview");
  });
  const notes = scale.intervals.map((interval) => PIANO_NOTE_NAMES[(root + interval) % 12]);
  el.scaleResult.innerHTML = `
    <strong>${PIANO_NOTE_NAMES[root]} ${scale.label}</strong>
    <span>${notes.join(" · ")}</span>
  `;
  el.scaleTipText.textContent = scale.use;
}

async function playPianoScale() {
  stopAllPianoVoices();
  const started = generation;
  const context = await getPianoAudioContext();
  if (!context || generation !== started || workspace.hidden) return;
  const root = Number(el.scaleRoot.value) || 0;
  const scale = PIANO_SCALES[el.scaleType.value] || PIANO_SCALES.major;
  const ascendingMidis = scale.intervals.map((interval) => 60 + root + interval);
  const midis = ascendingMidis.concat(ascendingMidis.slice(0, -1).reverse());
  workspace.querySelectorAll(".keyboard-key").forEach((button) => {
    button.classList.remove("chord-highlight", "game-preview");
  });
  midis.forEach((midi, index) => {
    schedule(() => {
      const button = workspace.querySelector(`.keyboard-key[data-midi="${midi}"]`);
      button?.classList.add("chord-highlight", "game-preview");
      const frequency = 440 * (2 ** ((midi + state.piano.transpose - 69) / 12));
      const voice = createPianoVoice(context, frequency, state.piano.sound);
      schedule(() => {
        releasePianoVoice(voice, true);
        button?.classList.remove("game-preview");
      }, 380);
    }, index * 470);
  });
}

function adjustKeyChange(delta) {
  keyboardKeyChange.steps = Math.max(-6, Math.min(6, keyboardKeyChange.steps + delta));
  renderKeyChangeGuide();
}

function keyChangePitch(root, steps) {
  return (root + steps + 120) % 12;
}

function formatKeyChangeSteps(steps) {
  if (steps > 0) return `+${steps}`;
  if (steps < 0) return `−${Math.abs(steps)}`;
  return "0";
}

function renderKeySignatureDisplay(keyIndex) {
  const signature = KEY_SIGNATURES[keyIndex];
  const symbol = signature.type === "sharp" ? "♯" : signature.type === "flat" ? "♭" : "♮";
  const signatureOffsets = signature.type === "sharp"
    ? [-10, 5, -15, 0, 15, -5, 10]
    : signature.type === "flat"
      ? [0, -15, 5, -10, 10, -5, 15]
      : [0];
  const symbols = Array.from({ length: Math.max(1, signature.count) }, (_, index) =>
    `<span style="--key-offset:${signatureOffsets[index]}px">${symbol}</span>`
  ).join("");
  const noteNames = signature.count ? signature.label.split(": ")[1] : "No sharps or flats";
  return `
    <div class="key-signature-display" role="img" aria-label="Key of ${KEY_CHANGE_NAMES[keyIndex]} major: ${signature.label}">
      <strong>Key of ${KEY_CHANGE_NAMES[keyIndex]} major</strong>
      <span class="key-signature-symbols ${signature.type || "natural"}" aria-hidden="true">${symbols}</span>
      <span class="key-signature-notes">${noteNames}</span>
    </div>
  `;
}

function renderKeyChangeGuide() {
  if (!el.keyChangeRoot || !el.keyChangeResult || !el.keyChangeTable) return;
  const root = Number(el.keyChangeRoot.value) || 0;
  const steps = keyboardKeyChange.steps;
  const result = keyChangePitch(root, steps);
  el.keyChangeSteps.textContent = formatKeyChangeSteps(steps);
  el.keyChangeDown.disabled = steps <= -6;
  el.keyChangeUp.disabled = steps >= 6;
  const direction = steps === 0
    ? "The music remains in its original key."
    : `Move every note ${Math.abs(steps)} semitone${Math.abs(steps) === 1 ? "" : "s"} ${steps > 0 ? "higher" : "lower"}.`;
  el.keyChangeResult.innerHTML = `
    <div class="key-change-summary">
      <strong>${KEY_CHANGE_NAMES[root]} <span aria-hidden="true">→</span> ${KEY_CHANGE_NAMES[result]}</strong>
      <span>${direction}</span>
    </div>
    ${renderKeySignatureDisplay(result)}
  `;
  el.keyChangeTable.innerHTML = Array.from({ length: 13 }, (_, index) => index - 6).map((rowSteps) => {
    const rowResult = keyChangePitch(root, rowSteps);
    const active = rowSteps === steps;
    return `
      <button type="button" data-key-change-step="${rowSteps}" class="${active ? "selected" : ""}" aria-pressed="${active}">
        <span>${formatKeyChangeSteps(rowSteps)}</span>
        <strong>${KEY_CHANGE_NAMES[rowResult]}</strong>
        <span>${KEY_SIGNATURES[rowResult].label}</span>
      </button>
    `;
  }).join("");
}

function handleKeyChangeTableClick(event) {
  const row = event.target.closest("[data-key-change-step]");
  if (!row) return;
  keyboardKeyChange.steps = Number(row.dataset.keyChangeStep);
  renderKeyChangeGuide();
}

async function playPianoGuideChord() {
  stopAllPianoVoices();
  renderPianoChordGuide();
  const unique = Array.from(workspace.querySelectorAll(".keyboard-key.chord-highlight"))
    .sort((a, b) => Number(a.dataset.midi) - Number(b.dataset.midi));
  const started = generation;
  const context = await getPianoAudioContext();
  if (!context || generation !== started || workspace.hidden) return;
  const voices = unique.map((button) => {
    button.classList.add("game-preview");
    return createPianoVoice(
      context,
      pianoNoteFrequency(button.getAttribute("aria-label")) * (2 ** (state.piano.transpose / 12)),
      state.piano.sound,
      { sustainChord: true }
    );
  });
  await waitPianoGame(1400);
  if (started !== generation) return;
  unique.forEach((button) => button.classList.remove("game-preview"));
  voices.forEach((voice) => releasePianoVoice(voice, true));
}

function waitPianoGame(milliseconds) {
  return new Promise((resolve) => schedule(resolve, milliseconds, resolve));
}

function handlePianoSoundChange(event) {
  stopAllPianoVoices();
  const value = event?.target?.value || el.keyboardSound.value;
  state.piano.sound = PIANO_SOUND_LABELS[value] ? value : "grand-piano";
  savePianoSettings();
  renderPiano();
}

function handlePianoVolumeChange(event) {
  const value = event?.target?.value ?? el.keyboardVolume.value;
  state.piano.volume = clamp(Number(value) / 100, 0, 1);
  savePianoSettings();
  renderPiano();
}

function setKeyboardTranspose(value) {
  state.piano.transpose = clamp(Math.round(Number(value) || 0), -6, 6);
  stopAllPianoVoices();
  savePianoSettings();
  renderPiano();
}

function adjustKeyboardTranspose(delta) {
  setKeyboardTranspose(state.piano.transpose + delta);
}

async function getPianoAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    window.alert("This browser cannot play these music sounds.");
    return null;
  }
  if (!state.piano.audioContext) {
    const context = new AudioContextCtor();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.2;
    const masterGain = context.createGain();
    masterGain.gain.value = state.piano.volume;
    masterGain.connect(compressor);
    compressor.connect(context.destination);
    state.piano.audioContext = context;
    state.piano.masterGain = masterGain;
    state.piano.compressor = compressor;
  }
  if (state.piano.audioContext.state === "suspended") await state.piano.audioContext.resume();
  return state.piano.audioContext;
}

function pianoNoteFrequency(label) {
  const match = String(label).match(/^([A-G])(?: sharp)?\s*(\d)$/i);
  if (!match) return 440;
  const noteIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1].toUpperCase()];
  const sharp = /sharp/i.test(label) ? 1 : 0;
  const midi = (Number(match[2]) + 1) * 12 + noteIndex + sharp;
  return 440 * (2 ** ((midi - 69) / 12));
}

async function handlePianoPointerDown(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  const button = event.currentTarget;
  if (state.piano.voices.has(event.pointerId)) return;
  try { button.setPointerCapture(event.pointerId); } catch (_error) {}
  state.piano.pointerNotes.set(event.pointerId, button);
  await playPianoNoteForPointer(event.pointerId, button);
}

async function playPianoNoteForPointer(pointerId, button) {
  const token = (state.piano.pointerTokens.get(pointerId) || 0) + 1;
  state.piano.pointerTokens.set(pointerId, token);
  const started = generation;
  const context = await getPianoAudioContext();
  if (!context || generation !== started || workspace.hidden) return;
  if (state.piano.pointerTokens.get(pointerId) !== token) return;
  let note = button.dataset.note || button.getAttribute("aria-label");
  const frequency = pianoNoteFrequency(note);
  const transpose = button.classList.contains("keyboard-key") ? state.piano.transpose : 0;
  const voice = createPianoVoice(context, frequency * (2 ** (transpose / 12)), state.piano.sound);
  voice.button = button;
  state.piano.voices.set(pointerId, voice);
  button.classList.add("is-playing");
}

function handlePianoPointerMove(event) {
  if (!state.piano.pointerNotes.has(event.pointerId)) return;
  event.preventDefault();
  const hit = document.elementFromPoint(event.clientX, event.clientY);
  const nextButton = hit && hit.closest ? hit.closest(".keyboard-key") : null;
  if (!nextButton || nextButton === state.piano.pointerNotes.get(event.pointerId)) return;
  const currentVoice = state.piano.voices.get(event.pointerId);
  if (currentVoice) releasePianoVoice(currentVoice);
  state.piano.voices.delete(event.pointerId);
  state.piano.pointerNotes.set(event.pointerId, nextButton);
  playPianoNoteForPointer(event.pointerId, nextButton);
}

function handlePianoPointerUp(event) {
  state.piano.pointerTokens.set(event.pointerId, (state.piano.pointerTokens.get(event.pointerId) || 0) + 1);
  state.piano.pointerNotes.delete(event.pointerId);
  const voice = state.piano.voices.get(event.pointerId);
  if (!voice) return;
  releasePianoVoice(voice);
  state.piano.voices.delete(event.pointerId);
}

function stopAllPianoVoices() {
  generation++;
  for (const [id, cancel] of timers) { clearTimeout(id); cancel?.(); }
  timers.clear();
  allVoices.forEach((voice) => releasePianoVoice(voice, true));
  allVoices.clear();
  workspace.querySelectorAll(".game-preview").forEach(key => key.classList.remove("game-preview"));
  state.piano.voices.clear();
  state.piano.pointerNotes.clear();
  state.piano.pointerTokens.clear();
  workspace.querySelectorAll(".keyboard-key.is-playing").forEach((button) => button.classList.remove("is-playing"));
}

function releasePianoVoice(voice, force = false) {
  if (!voice || (voice.released && !force)) return;
  voice.released = true;
  if (voice.button) voice.button.classList.remove("is-playing");
  if (voice.oneShot && !force) return;
  const context = state.piano.audioContext;
  if (!context) return;
  const now = context.currentTime;
  voice.gains.forEach((gain) => {
    if (typeof gain.gain.cancelAndHoldAtTime === "function") {
      gain.gain.cancelAndHoldAtTime(now);
    } else {
      const currentLevel = Math.max(0.0001, gain.gain.value);
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(currentLevel, now);
    }
    gain.gain.setTargetAtTime(0.0001, now, voice.release || 0.08);
  });
  voice.sources.forEach((source) => {
    try { source.stop(now + Math.max(0.12, (voice.release || 0.08) * 5)); } catch (_error) {}
  });
}

function createPianoVoice(context, frequency, sound, options = {}) {
  const now = context.currentTime;
  const sustainChord = Boolean(options.sustainChord);
  const voice = {
    sources: [],
    gains: [],
    release: 0.08,
    released: false,
    oneShot: true
  };
  const destination = state.piano.masterGain;
  const addTone = (ratio, type, level, attack, decay, sustain = 0.0001, detune = 0, end = 4) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency * ratio;
    oscillator.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), now + Math.max(0.004, attack));
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), now + Math.max(attack + 0.02, decay));
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(now);
    oscillator.stop(now + end);
    voice.sources.push(oscillator);
    voice.gains.push(gain);
    return { oscillator, gain };
  };
  const addNoise = (level, duration, filterFrequency = 1800) => {
    const frameCount = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = filterFrequency;
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(now);
    source.stop(now + duration);
    voice.sources.push(source);
    voice.gains.push(gain);
  };
  if (sound === "grand-piano") {
    addTone(1, "triangle", 0.36, 0.003, sustainChord ? 2.4 : 1.35, sustainChord ? 0.035 : 0.0001, -3, sustainChord ? 3.1 : 1.6);
    addTone(1, "sine", 0.2, 0.002, sustainChord ? 2.1 : 1.05, sustainChord ? 0.025 : 0.0001, 3, sustainChord ? 2.8 : 1.3);
    addTone(2, "sine", 0.11, 0.001, sustainChord ? 1.25 : 0.5, sustainChord ? 0.008 : 0.0001, -4, sustainChord ? 1.8 : 0.7);
    addTone(3, "sine", 0.04, 0.001, 0.24, 0.0001, 5, 0.4);
    addNoise(0.035, 0.035, 4200);
    voice.release = sustainChord ? 0.24 : 0.055;
  } else if (sound === "electric-piano") {
    addTone(1, "sine", 0.31, 0.004, 2.1, 0.0001, -7, 2.5);
    addTone(1, "sine", 0.22, 0.004, 1.8, 0.0001, 7, 2.2);
    addTone(2.01, "sine", 0.17, 0.002, 1.15, 0.0001, 0, 1.45);
    addTone(3.98, "sine", 0.075, 0.001, 0.55, 0.0001, 0, 0.8);
    addTone(7.96, "sine", 0.025, 0.001, 0.22, 0.0001, 0, 0.4);
    voice.release = 0.11;
  } else if (sound === "bell") {
    addTone(1, "sine", 0.25, 0.002, 2.2, 0.0001, 0, 2.6);
    addTone(2.76, "sine", 0.1, 0.002, 1.5, 0.0001, 0, 1.9);
    addTone(5.4, "sine", 0.035, 0.002, 0.9, 0.0001, 0, 1.2);
  }
  allVoices.add(voice);
  let remaining = voice.sources.length;
  for (const source of voice.sources) source.onended = () => { source.disconnect(); if (--remaining === 0) { voice.gains.forEach(gain => gain.disconnect()); allVoices.delete(voice); } };
  return voice;
}

setupKeyboardUi();
  el.keyboardSound.addEventListener("change", handlePianoSoundChange);
  el.keyboardVolume.addEventListener("input", handlePianoVolumeChange);
  el.keyboardTransposeDown.addEventListener("click", () => adjustKeyboardTranspose(-1));
  el.keyboardTransposeReset.addEventListener("click", () => setKeyboardTranspose(0));
  el.keyboardTransposeUp.addEventListener("click", () => adjustKeyboardTranspose(1));
  el.pianoStyle.addEventListener("change", applyPianoStyleGuide);
  el.pianoStyleRecipe.addEventListener("click", handlePianoStyleRecipeClick);
  el.pianoChordRoot.addEventListener("change", handlePianoChordRootChange);
  el.pianoChordType.addEventListener("change", renderPianoChordGuide);
  el.pianoChordPlayButton.addEventListener("click", playPianoGuideChord);
  el.chordGuideTab.addEventListener("click", () => showKeyboardGuide("chord"));
  el.keyChangeTab.addEventListener("click", () => showKeyboardGuide("key"));
  el.scaleGuideTab.addEventListener("click", () => showKeyboardGuide("scale"));
  el.keyChangeRoot.addEventListener("change", renderKeyChangeGuide);
  el.keyChangeDown.addEventListener("click", () => adjustKeyChange(-1));
  el.keyChangeUp.addEventListener("click", () => adjustKeyChange(1));
  el.keyChangeTable.addEventListener("click", handleKeyChangeTableClick);
  el.scaleRoot.addEventListener("change", renderPianoScaleGuide);
  el.scaleType.addEventListener("change", renderPianoScaleGuide);
  el.scalePlayButton.addEventListener("click", playPianoScale);
  workspace.querySelectorAll(".keyboard-key").forEach((button) => {
    button.addEventListener("pointerdown", handlePianoPointerDown);
    button.addEventListener("pointermove", handlePianoPointerMove);
    button.addEventListener("pointerup", handlePianoPointerUp);
    button.addEventListener("pointercancel", handlePianoPointerUp);
    button.addEventListener("lostpointercapture", handlePianoPointerUp);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  });

workspace.querySelectorAll('.keyboard-key').forEach(button => {
 button.addEventListener('keydown',event => {if(![' ','Enter'].includes(event.key)||event.repeat)return;event.preventDefault();playPianoNoteForPointer('key:'+button.dataset.midi,button);});
 button.addEventListener('keyup',event => {if(![' ','Enter'].includes(event.key))return;event.preventDefault();handlePianoPointerUp({pointerId:'key:'+button.dataset.midi});});
 button.addEventListener('blur',() => handlePianoPointerUp({pointerId:'key:'+button.dataset.midi}));
 // Assistive-technology activation has no preceding pointer/keyboard event.
 button.addEventListener('click',event => {if(event.detail!==0||event.isTrusted===false||state.piano.voices.size)return;const id='assist:'+button.dataset.midi;void playPianoNoteForPointer(id,button);schedule(()=>handlePianoPointerUp({pointerId:id}),380);});
});
const tabs=[el.chordGuideTab,el.keyChangeTab,el.scaleGuideTab];
tabs.forEach((tab,index)=>tab.addEventListener('keydown',event=>{const offset={ArrowRight:1,ArrowLeft:-1}[event.key];if(!offset&&!['Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(index+offset+3)%3;tabs[next].click();tabs[next].focus();}));
el['keyboard-home'].innerHTML=document.getElementById('songs').innerHTML;
el['keyboard-home'].onclick=onHome;
const theme=el['keyboard-theme'],settings=createDisplaySettings({id:'keyboard-settings',label:'Keyboard Settings',controls:[theme]});
workspace.querySelector('.workspace-return').append(settings.element);
window.addEventListener('blur',stopAllPianoVoices);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAllPianoVoices();});
renderPiano();showKeyboardGuide('chord');
return {open(){workspace.hidden=false;document.title='Keyboard · MusicTranspose';el.keyboardTitle.focus({preventScroll:true});},hide(){settings.close();if(!workspace.hidden)stopAllPianoVoices();workspace.hidden=true;}};
}
