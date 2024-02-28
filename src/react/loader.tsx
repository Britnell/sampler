import { useEffect, useState, type FormEvent } from "react";
import Player from "./player";

/* 
  TODO
  -X delete key modal
  -X copy key
  - sample speed
  - sample edit (popup arrowkeys move beginning)
  - click to seek
  - zoom waveform
  - [ ] Set sample length & play until end
*/

export const audioContext = new (window.AudioContext ||
  window.webkitAudioContext)();

export const loadSource = (buffer: AudioBuffer | void, speed: number = 1.0) => {
  if (!buffer) return null;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;
  source.connect(audioContext.destination);
  return source;
};

export default function Loader() {
  const [buffers, setBuffers] = useState<BufferState>({});

  useEffect(() => {
    // load files from db
    const load = async () => {
      const blobs = await samplesDbReadAll().catch((e) => {
        console.error(e);
        return;
      });
      if (!blobs) return;

      const srcs: BufferState = {};
      await Promise.all(
        Object.entries(blobs).map(async ([name, blob]) => {
          // load array from blob
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = await audioContext
            .decodeAudioData(arrayBuffer)
            .catch((err) => console.error("err decode", err, name));
          if (!buffer) return;
          srcs[name] = buffer;
          return buffer;
        })
      );

      setBuffers(srcs);
    };
    load();
  }, []);

  const loadFile = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      // Load buffer
      const arrayBuffer = ev.target?.result as ArrayBuffer;
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      setBuffers((s) => ({ ...s, [file.name]: buffer }));

      // store in db
      const blob = new Blob([file], { type: file.type });
      await samplesDbWrite(blob, file.name).catch((err) => console.error(err));
    };
    reader.readAsArrayBuffer(file);
  };

  const removeBuffer = (bufferid: string) => {
    const _buffers = { ...buffers };
    delete _buffers[bufferid];
    setBuffers(_buffers);
    // rmv in local storage
    samplesDbRemove(bufferid);
  };

  const loadFromUrl = async (ev: FormEvent) => {
    ev.preventDefault();
    const uri = (ev.target as HTMLFormElement).url.value;
    console.log({ uri });
    const blob = await fetch(uri).then((res) => res.blob());
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    setBuffers((s) => ({ ...s, [uri]: audioBuffer }));
    await samplesDbWrite(blob, uri).catch((err) => console.error(err));
  };

  return (
    <>
      <header className=" max-w-[1000px] mx-auto">
        <h1 className=" my-2 text-2xl">Audio-Sampler</h1>
        <div className=" mt-4">
          <h2 className=" text-xl">Add source files</h2>
          <div className=" grid grid-cols-2 gap-10">
            <label className=" flex gap-y-2 flex-col ">
              <span>load local file :</span>
              <input
                type="file"
                accept="audio/mp3"
                onChange={(ev) => {
                  const ip = ev.target as HTMLInputElement;
                  loadFile(ip.files?.[0]);
                }}
              />
            </label>
            <label className=" flex gap-y-2 flex-col ">
              <span>load from url :</span>
              <form onSubmit={loadFromUrl}>
                <input
                  type="text"
                  name="url"
                  className=" bg-transparent border border-[var(--b2)] "
                />
                <button>load</button>
              </form>
            </label>
          </div>
        </div>
      </header>
      <main>
        <Player buffers={buffers} removeBuffer={removeBuffer} />
      </main>
      <footer className=" mt-[200px] max-w-[1000px] mx-auto">
        <p className=" my-3">
          NOTE - samples are loaded when the key is released - so it will only
          play on the 2nd time a button is pushed. For now this is not a bug,
          but optimisation shortcut.
        </p>
        <p>
          DO NOT USE WITH BLUETOOTH, only wired speakers. BT speakers can add
          extra delay and ruin the responsiveness.
        </p>
        <p>Made for the web & OS - </p>
        <p className=" my-3 text-center">
          Made for the web & OS, with 💙, by Britnell - &nbsp;
          <a
            href="https://github.com/Britnell/astro-gym/blob/main/src/react/loader.tsx"
            target="_blank"
            rel="noreferrer"
            className=" underline"
          >
            see github
          </a>{" "}
          - feedback welcome
        </p>
      </footer>
    </>
  );
}

// ================================

const DB_NAME = "web-sampler";
const STORE_NAME = "samples-cache";

async function getDbStore(): Promise<IDBObjectStore | string> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore(STORE_NAME);
    };

    req.onsuccess = async () => {
      const db = req.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.onerror = (ev) => {
        console.error(ev);
        reject("transaction error ");
      };

      const objectStore = transaction.objectStore(STORE_NAME);
      resolve(objectStore);
    };

    req.onerror = (ev) => {
      console.error(ev);
      reject("db req error ");
    };
  });
}

function samplesDbWrite(blob: Blob, filename: string) {
  return new Promise(async (resolve, reject) => {
    const objectStore = await getDbStore();
    if (typeof objectStore === "string") {
      reject(objectStore);
      return;
    }
    const req = objectStore.put(blob, filename);
    req.onsuccess = () => {
      resolve({ success: true });
    };
    req.onerror = (ev) => {
      console.error(ev);
      reject("req error ");
    };
  });
}

function samplesDbRemove(filename: string) {
  return new Promise(async (resolve, reject) => {
    const objectStore = await getDbStore();
    if (typeof objectStore === "string") {
      reject(objectStore);
      return;
    }
    const req = objectStore.delete(filename);
    req.onsuccess = () => {
      resolve({ success: true });
    };
    req.onerror = (ev) => {
      console.error(ev);
      reject("req error ");
    };
  });
}

function samplesDbReadAll(): Promise<{ [key: string]: Blob }> {
  return new Promise(async (resolve, reject) => {
    const objectStore = await getDbStore();
    if (typeof objectStore === "string") {
      reject(objectStore);
      return;
    }

    const req = objectStore.openCursor(); // Use a cursor for large datasets

    req.onerror = (ev) => {
      console.error(ev);
      reject(" cursor error ");
    };

    const samples: { [key: string]: any } = {};

    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (typeof cursor.key === "string") {
          samples[cursor.key] = cursor.value;
        }
        cursor.continue();
        return;
      }
      resolve(samples);
    };
  });
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export type BufferState = { [name: string]: AudioBuffer };
