import { useEffect, useState } from "react";
import { useLocalStorageState } from "./hooks";
import { Modal } from "./Modal";
import { Loader } from "./loader";

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

const ALLKEYS = "qwertyuiopasdfghjklzxcvbnm1234567890";

export default function App() {
  const [buffers, setBuffers] = useState<BufferState>({});
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useLocalStorageState<SamplesT>(
    "sample-keys",
    {}
  );
  const [edit, setEdit] = useState("");

  useEffect(() => {
    const keydown = (ev: KeyboardEvent) => {
      const { key } = ev;
      console.log({ key });

      if (ALLKEYS.includes(key)) {
        // SAMPLE KEY
        setEdit(key);
      }

      if (key.startsWith("Arrow")) {
        // ARROW KEYS
        return;
      }
    };

    const keyup = (ev: KeyboardEvent) => {
      const { key } = ev;
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, []);

  const editingSample = samples[edit];

  return (
    <div className=" max-w-[1000px] mx-auto">
      <header>
        <h1 className=" my-2 text-2xl">Audio-Sampler</h1>
      </header>
      <main className=" h-[calc(100vh-60px)] grid grid-rows-[1fr_300px] gap-10 ">
        {!editingSample?.active && (
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
        )}
        {editingSample?.active && (
          <section>
            <div className="flex justify-between">
              <h2>EDITIING {edit}</h2>
              <button onClick={() => setEdit("")}>close</button>
            </div>
            <p>{JSON.stringify(editingSample)}</p>
            <Preview
              sample={editingSample}
              bufferId={editingSample.bufferid}
              buffer={buffers[editingSample.bufferid]}
            />
          </section>
        )}
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

const Preview = ({
  bufferId,
  buffer,
  sample,
}: {
  bufferId: string;
  // edit: string;
  buffer: AudioBuffer;
  sample: SampleT;
  // callback: (type: string, val: any) => void;
  // removeBuffer: (id: string) => void;
}) => {
  const [wavebuffer, setWavebuffer] = useState<number[] | null>(null);
  useEffect(() => {
    // calc wavebuffer for viz
    const audioData = buffer.getChannelData(0);
    const chunkSize = buffer.sampleRate / 1000;
    const chunks = audioData.length / chunkSize;
    let last = 0;

    const wave = [];
    for (let x = 1; x < chunks; x++) {
      const to = Math.floor(chunkSize * x);
      const slice = audioData.slice(last, to);
      const max = findmax(slice);
      wave.push(max);
      last = to + 1;
    }

    setWavebuffer(wave);
  }, [buffer]);

  return <div>asdasd</div>;
};

export const findmax = (arr: Float32Array | number[]) => {
  let max = 0;
  arr.forEach((v) => {
    const x = Math.abs(v);
    if (x > max) max = x;
  });
  return max;
};

const Keyboard = ({ samples }: { samples: SamplesT }) => {
  return (
    <section>
      <div className=" flex flex-col gap-1 ">
        <div className=" ml-[0vw] flex gap-1 ">
          {"qwertyuiop".split("").map((k) => (
            <Key key={k} letter={k} sample={samples[k]} />
          ))}
        </div>
        <div className=" ml-[2vw] flex gap-1">
          {"asdfghjkl".split("").map((k) => (
            <Key key={k} letter={k} sample={samples[k]} />
          ))}
        </div>
        <div className=" ml-[5vw] flex gap-1">
          {"zxcvbnm".split("").map((k) => (
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
