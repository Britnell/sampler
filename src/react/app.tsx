import { useEffect, useState, type FormEvent } from "react";
import { samplesDbReadAll, samplesDbRemove, samplesDbWrite } from "./indexdb";
import { loadArrayBuffer, loadBlobBuffer, loadUriBuffer } from "./audio";
import { useLocalStorageState } from "./hooks";
import { Modal } from "./Modal";

export type BufferState = { [name: string]: AudioBuffer };

export type SampleT = {
  key: string;
  begin: number;
  active: boolean;
  bufferid: string;
};
export type SamplesT = {
  [id: string]: SampleT | null;
};

export default function App() {
  const [buffers, setBuffers] = useState<BufferState>({});
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useLocalStorageState<SamplesT>(
    "sample-keys",
    {}
  );

  // const removeBuffer = (bufferid: string) => {
  //   const _buffers = { ...buffers };
  //   delete _buffers[bufferid];
  //   setBuffers(_buffers);
  //   // rmv in local storage
  //   samplesDbRemove(bufferid);
  // };

  return (
    <div className=" max-w-[1000px] mx-auto">
      <header>
        <h1 className=" my-2 text-2xl">Audio-Sampler</h1>
      </header>
      <main className=" h-[calc(100vh-60px)] grid grid-rows-[1fr_300px] gap-10 ">
        <section>
          <Loader setBuffers={setBuffers} setLoading={setLoading} />
          <div>
            <h2>Sources</h2>
            <ul className=" list-disc pl-5">
              {Object.entries(buffers).map(([name, buffer]) => (
                <li key={name}>
                  <span className=" ">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <Keyboard samples={samples} />
      </main>
      <Modal isOpen={loading}>
        <div className=" bg-[var(--b2)]">
          <p className=" text-3xl">LOADING....</p>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
export function Loader({
  // buffers,
  setBuffers,
  setLoading,
}: {
  // buffers: BufferState;
  setBuffers: React.Dispatch<React.SetStateAction<BufferState>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  useEffect(() => {
    // load files from db
    const load = async () => {
      const blobs = await samplesDbReadAll().catch((e) => {
        console.error(e);
        return;
      });
      if (!blobs) return;

      const srcs: BufferState = {};
      setLoading(true);
      await Promise.all(
        Object.entries(blobs).map(async ([name, blob]) => {
          // load array from blob
          const buffer = await loadBlobBuffer(blob);
          if (!buffer) return;
          srcs[name] = buffer;
          return buffer;
        })
      );

      setLoading(false);
      setBuffers(srcs);
    };
    load();
  }, []);

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const arrayBuffer = ev.target?.result as ArrayBuffer;
      const buffer = await loadArrayBuffer(arrayBuffer);
      if (!buffer) return;
      setBuffers((s) => ({ ...s, [file.name]: buffer }));
      // store in db
      const blob = new Blob([file], { type: file.type });
      await samplesDbWrite(blob, file.name).catch((err) => console.error(err));
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadFromUrl = async (ev: FormEvent) => {
    ev.preventDefault();
    const uri = (ev.target as HTMLFormElement).url.value;
    const { audioBuffer, blob } = await loadUriBuffer(uri);
    setLoading(true);
    setBuffers((s) => ({ ...s, [uri]: audioBuffer }));
    await samplesDbWrite(blob, uri).catch((err) => console.error(err));
    setLoading(false);
  };

  return (
    <>
      <>
        <section>
          <div>
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
                <div>
                  <p>
                    Play rhythm roulette & get a random song for the LOC records
                  </p>
                  <a
                    href="/api/random"
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Random
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    </>
  );
}

const Keyboard = ({ samples }: { samples: SamplesT }) => {
  console.log(samples.q);

  return (
    <section>
      <div className=" flex flex-col gap-1 ">
        <div className=" ml-[0vw] flex gap-1 ">
          {"qwertyuiop".split("").map((k) => (
            <Key key={k} letter={k} sample={samples[k]} />
          ))}
        </div>
        <div className=" ml-[2vw] flex gap-1">
          {"asdfghjkl;".split("").map((k) => (
            <Key key={k} letter={k} sample={samples[k]} />
          ))}
        </div>
        <div className=" ml-[5vw] flex gap-1">
          {"zxcvbnm,.".split("").map((k) => (
            <Key key={k} letter={k} sample={samples[k]} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Key = ({
  letter,
  sample,
}: {
  letter: string;
  sample: SampleT | null;
}) => {
  return (
    <button className=" w-[9vw] border border-white aspect-square">
      {letter}
    </button>
  );
};

const Footer = () => (
  <footer className=" mt-[200px] max-w-[1000px] mx-auto">
    <p>
      DO NOT USE WITH BLUETOOTH, only wired speakers. BT speakers can add extra
      delay and ruin the responsiveness.
    </p>
    <p className=" my-3 text-center">
      Made open-source with 💙 for the web, by &nbsp;
      <a
        href="https://britnell.github.io/portfolio/about/"
        target="_blank"
        rel="noreferrer"
        className=" underline"
      >
        Britnell
      </a>
      - &nbsp;
      <br />
      <a
        href="https://github.com/Britnell/astro-gym/blob/main/src/react/loader.tsx"
        target="_blank"
        rel="noreferrer"
        className=" underline"
      >
        code on github
      </a>{" "}
      - feedback welcome
    </p>
  </footer>
);
