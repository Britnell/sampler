import type { BufferState, SampleT, SamplesT } from "./hooks";
import { readFile } from "./lib";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const audioContext = new (window.AudioContext ||
  window.webkitAudioContext)();

export let passFilter: BiquadFilterNode;

const output = audioContext.createGain();
output.connect(audioContext.destination);

export const clearPassFilter = () => setPassFilter("highpass", 0);

export const setPassFilter = (type: "highpass" | "lowpass", f: number) => {
  passFilter = audioContext.createBiquadFilter();
  passFilter.type = type;
  passFilter.frequency.value = f;
};

//  DELAY

let delayNode = audioContext.createDelay();
delayNode.delayTime.value = 0.5;
let feedbackGain = audioContext.createGain();
feedbackGain.gain.value = 0.5;
let dryGain = audioContext.createGain();
dryGain.gain.value = 0.5;
let wetGain = audioContext.createGain();
wetGain.gain.value = 0.5;

let delayEnable = false;

export const setDelay = ({
  time,
  feedback,
  dry,
  wet,
}: {
  time: number;
  feedback: number;
  dry: number;
  wet: number;
}) => {
  delayNode.delayTime.value = time;
  feedbackGain.gain.value = feedback;
  dryGain.gain.value = dry;
  wetGain.gain.value = wet;
};

export const enableDelay = (st: boolean) => (delayEnable = st);

const outputFilteredSource = (source: AudioBufferSourceNode) => {
  source.connect(passFilter);
  if (delayEnable)
    connectDelay(source);
  else
    passFilter.connect(output);
};

const connectDelay = (source: AudioNode) => {
  source.connect(delayNode);
  delayNode.connect(wetGain);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  source.connect(dryGain);
  dryGain.connect(output);
  wetGain.connect(output);
};

//  Buffers 

export const loadUriBuffer = async (uri: string) => {
  const blob = await fetch(uri)
    .then((res) => res.blob())
    .catch((_) => null);
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
    .catch((_) => null);
  return buffer;
};

// Audio Source

type Source = { [id: string]: AudioBufferSourceNode | null };

const sources: Source = {};

export const loadAudioSource = (buffer: AudioBuffer | void, speed: number) => {
  if (!buffer) return null;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;
  outputFilteredSource(source);
  return source;
};

export const playSample = (sample: SampleT, buffer: AudioBuffer | null) => {
  // a 'hold' sample might be playing
  if (sample.hold) stopSampleReload(sample, buffer);

  const dur = sample.end ? sample.end - sample.begin : undefined;
  try {
    sources[sample.key]?.start(audioContext.currentTime, sample.begin, dur);
  } catch (e) {
    //
  }
};

export const stopAllSamples = (samples: SamplesT, buffers: BufferState) => {
  Object.values(samples).forEach((sample) => {
    if (!sample) return;
    const buffer = buffers[sample.bufferid];
    stopSampleReload(sample, buffer);
  });
};

export const stopSampleReload = (
  sample: SampleT,
  buffer: AudioBuffer | null
) => {
  stopSample(sample);
  if (buffer) loadSample(sample, buffer);
};

export const loadSample = (sample: SampleT, buffer: AudioBuffer) => {
  sources[sample.key] = loadAudioSource(buffer, sample.speed);
};

export const stopSample = (sample: SampleT | string) => {
  try {
    if (typeof sample === "string") sources[sample]?.stop();
    else sources[sample.key]?.stop();
  } catch (e) {
    //
  }
};

export const stopMutegroup = (
  sample: SampleT,
  samples: SamplesT,
  buffers: BufferState
) => {
  if (!sample.mutegroup) return;

  Object.values(samples).forEach((other) => {
    if (!other) return;
    if (sample.key === other.key) return;
    if (sample.mutegroup !== other.mutegroup) return;
    const buffer = buffers[other.bufferid];
    stopSampleReload(other, buffer);
  });
};

//  harmonics

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

export const playHarmonic = (
  sample: SampleT,
  buffer: AudioBuffer | null,
  pitch: number,
  key: string
) => {
  if (!buffer) return null;
  const speed = Math.pow(2, pitch / 12);
  sources[`h-${key}`] = loadAudioSource(buffer, speed);

  // play
  const dur = sample.end ? sample.end - sample.begin : undefined;
  try {
    sources[`h-${key}`]?.start(audioContext.currentTime, sample.begin, dur);
  } catch (e) {}
};

export const stopHarmonic = (key: string) => {
  try {
    sources[`h-${key}`]?.stop();
  } catch (e) {}
};


//  Record

let mediaStreamDestination: MediaStreamAudioDestinationNode;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

export const setupRecording = () => {
  mediaStreamDestination = audioContext.createMediaStreamDestination();
  mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  output.connect(mediaStreamDestination);
};

setupRecording() // -------

export const startRecording = () => {
  if (!mediaRecorder) {
    setupRecording();
  }
  recordedChunks = [];
  mediaRecorder?.start();
};

export const stopRecording = (): Promise<Blob> => {
  return new Promise((resolve) => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        resolve(blob);
      };
      mediaRecorder.stop();
    } else {
      resolve(new Blob());
    }
  });
};

// 

export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => {
      reject(new Error('FileReader error'));
    };
    reader.readAsDataURL(blob);
  });
};

export const saveAudioFile = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filenameTimestring()
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

const filenameTimestring = ()=>new Date().toISOString().replaceAll(/[.:]/g,':')


// const getFileExtension = (mimeType: string): string => {
//   const extensions: { [key: string]: string } = {
//     'audio/webm': 'webm',
//     'audio/ogg': 'ogg',
//     'audio/wav': 'wav',
//     'audio/mpeg': 'mp3',
//     'audio/mp4': 'm4a',
//     'audio/x-matroska': 'mka'
//   };
//   return extensions[mimeType] || 'bin';  // Default to 'bin' if MIME type is unknown
// };
