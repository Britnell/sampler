import type { BufferState } from "../react/loader";
import { loadBlobBuffer } from "./audio";
import { samplesDbReadAll } from "./indexdb";

export async function loadCachedSamples() {
  const blobs = await samplesDbReadAll().catch((e) => console.error(e));
  if (!blobs) return;
  const buffers: BufferState = {};
  //   setLoading(true);
  await Promise.all(
    Object.entries(blobs).map(async ([name, blob]) => {
      // load array from blob
      const buffer = await loadBlobBuffer(blob);
      if (!buffer) return;
      buffers[name] = buffer;
      return buffer;
    })
  );
  return buffers;
}

export const readFile = async (file: File): Promise<ArrayBuffer | null> => {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const arrayBuffer = ev.target?.result as ArrayBuffer;
      res(arrayBuffer);
    };
    reader.onerror = () => {
      rej();
    };
    reader.readAsArrayBuffer(file);
  });
};

export const limit = (x: number, min: number, max: number) => {
  if (x < min) return min;
  if (x > max) return max;
  return x;
};
