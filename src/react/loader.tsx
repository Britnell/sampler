import { useEffect, useState, type FormEvent } from "react";
import Player from "./player";

/* 
  TODO
  -X delete key modal
  -X copy key
  -X sample speed
  - sample edit modal (popup arrowkeys move beginning)
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
  const [demo, setDemo] = useState<string | undefined>(undefined);

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

  const loadUri = async (uri: string) => {
    console.log(" LOAD", uri);

    const blob = await fetch(uri).then((res) => res.blob());
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    setBuffers((s) => ({ ...s, [uri]: audioBuffer }));
    await samplesDbWrite(blob, uri).catch((err) => console.error(err));
    console.log(" DONE");
  };

  const loadFromUrl = async (ev: FormEvent) => {
    ev.preventDefault();
    const uri = (ev.target as HTMLFormElement).url.value;
    loadUri(uri);
  };

  const loadDemo = async () => {
    if (!selectedDemo) return;
    loadUri(selectedDemo.url);
  };

  const selectedDemo = demoSamples.find((d) => d.name === demo);

  return (
    <>
      <header className=" max-w-[1000px] mx-auto">
        <h1 className=" my-2 text-2xl">Audio-Sampler</h1>
        <h2 className=" mt-8 text-xl pl-4">Add source files</h2>
        <div className="  p-4 bg-[#282dbd] bg-opacity-5">
          <div className=" grid grid-cols-3 gap-10">
            <label>
              <span className=" mb-3 block">load local file :</span>
              <input
                type="file"
                accept="audio/mp3"
                onChange={(ev) => {
                  const ip = ev.target as HTMLInputElement;
                  loadFile(ip.files?.[0]);
                }}
              />
            </label>
            <label>
              <span className=" mb-3 block">load from url :</span>
              <form onSubmit={loadFromUrl}>
                <input
                  type="text"
                  name="url"
                  className=" bg-transparent border border-[var(--b2)] "
                />
                <button className=" bg-white text-[var(--bg)]">load</button>
              </form>
            </label>
            <label htmlFor="">
              <span className=" mb-3 block">Load demo sample :</span>
              <div>
                <select
                  name="demo"
                  className=" bg-[var(--bg)] text-white w-[180px] inline-block "
                  // onChange={()=>}
                  value={demo}
                  onChange={(ev) => setDemo(ev.target.value)}
                >
                  <option value=""></option>
                  {demoSamples.map((demo, i) => (
                    <option key={i} value={demo.name}>
                      {demo.name}
                    </option>
                  ))}
                </select>
                <button
                  className=" bg-white text-[var(--bg)]"
                  onClick={loadDemo}
                >
                  load
                </button>
              </div>
              {selectedDemo && (
                <p className=" text-sm mt-2 ">
                  demo &nbsp;
                  <a
                    className=" underline"
                    href={selectedDemo.source}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    source
                  </a>
                  &nbsp;
                </p>
              )}
              {/* <p>
                ( samples from{" "}
                )
              </p> */}
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

const demoSamples = [
  {
    name: "The Father, The Son, and The Harold Rubin",
    url: "/The-Harold-Rubin.mp3",
    source:
      "https://freemusicarchive.org/music/Harold_Rubin_Ehran_Elisha__Haim_Elisha/East_Of_Jaffa/02_East_Of_Jaffa_-_The_Father_The/",
  },
  {
    name: "Song for Bilbao",
    url: "/songforbilbao.mp3",
    source:
      "https://freemusicarchive.org/music/Jazz_at_Mladost_Club/Jazz_Night/Song_for_Bilbao/",
  },
];
