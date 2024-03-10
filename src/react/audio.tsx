declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const audioContext = new (window.AudioContext ||
  window.webkitAudioContext)();

export const loadUriBuffer = async (uri: string) => {
  const blob = await fetch(uri).then((res) => res.blob());
  const audioBuffer = await loadBlobBuffer(blob);
  return { blob, audioBuffer };
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
