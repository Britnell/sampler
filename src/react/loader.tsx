import { useEffect, type FormEvent } from "react";
import { samplesDbReadAll, samplesDbWrite } from "./indexdb";
import { loadArrayBuffer, loadBlobBuffer, loadUriBuffer } from "./audio";
import type { BufferState } from "./app";

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
