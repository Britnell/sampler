import type { SampleT } from "./hooks";
import { readFile } from "./lib";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const audioContext = new (window.AudioContext ||
  window.webkitAudioContext)();

export const loadAudioSource = (
  buffer: AudioBuffer | void,
  speed: number = 1.0
) => {
  if (!buffer) return null;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;
  source.connect(audioContext.destination);
  return source;
};

export const loadUriBuffer = async (uri: string) => {
  const blob = await fetch(uri)
    .then((res) => res.blob())
    .catch((err) => null);
  if (!blob) return {};
  const audioBuffer = await loadBlobBuffer(blob);
  return { blob, audioBuffer };
};

export const loadFileBuffer = async (file: File) => {
  const arrayBuffer = await readFile(file);
  if (!arrayBuffer) return;
  const buffer = await loadArrayBuffer(arrayBuffer);
  return buffer;
};

export const loadBlobBuffer = async (blob: Blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = await loadArrayBuffer(arrayBuffer);
  return buffer;
};

export const loadArrayBuffer = async (arrayBuffer: ArrayBuffer) => {
  const buffer = await audioContext
    .decodeAudioData(arrayBuffer)
    .catch((err) => console.error("err decode", err));
  return buffer;
};

export const loadBufferSource = (
  buffer: AudioBuffer | void,
  speed: number = 1.0
) => {
  if (!buffer) return null;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;
  source.connect(audioContext.destination);
  return source;
};

export const startNow = () => audioContext.currentTime;

export const beep = (dur: number, f?: number) => {
  const beeper = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  beeper.type = "square";
  beeper.frequency.value = f ?? 440;
  gainNode.gain.value = 0.1;
  beeper.connect(gainNode);
  gainNode.connect(audioContext.destination);
  //
  beeper.start();
  setTimeout(() => beeper.stop(), dur);
};

type Source = { [id: string]: AudioBufferSourceNode | null };

const sources: Source = {};

export const playSample = (sample: SampleT) => {
  const dur = sample.end ? sample.end - sample.begin : undefined;
  sources[sample.key]?.start(audioContext.currentTime, sample.begin, dur);
};

export const stopSample = (sample: SampleT) => {
  try {
    sources[sample.key]?.stop();
  } catch (e) {
    //
  }
};

export const loadSample = (sample: SampleT, buffer: AudioBuffer) => {
  if (!sample?.active) return;
  sources[sample.key] = loadAudioSource(buffer, 1.0);
};
