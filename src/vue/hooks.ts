import {
  ref,
  onMounted,
  onUnmounted,
  watchEffect,
  type UnwrapRef,
  type Ref,
} from "vue";
import { loadAudioSource, startNow } from "./audio";
import { limit } from "./lib";

export type BufferState = { [name: string]: AudioBuffer };

export type SampleT = {
  key: string;
  bufferid: string;
  active: boolean;
  held: boolean;
  begin: number;
  end?: number | null;
};
export type SamplesT = {
  [id: string]: SampleT | null;
};
export type Ui = {
  sample: SampleT | null;
  modal: { type: string; value?: string } | null;
  assignBuffer: string;
  edit: "begin" | "end" | null;
  loading: boolean;
};

const readLocal = <T>(key: string, initial: T): T => {
  try {
    const str = localStorage.getItem(key);
    if (!str) return initial;
    return JSON.parse(str);
  } catch (e) {
    return initial;
  }
};

export function cachedRef<T>(key: string, initial: T): Ref<UnwrapRef<T>> {
  const state = ref<T>(initial);
  state.value = readLocal<T>(key, initial) as UnwrapRef<T>;

  watchEffect(() => {
    localStorage.setItem(key, JSON.stringify(state.value));
  });
  return state;
}

export function useKeyboard(
  ui: Ref<Ui>,
  samples: Ref<SamplesT>,
  buffers: Ref<BufferState>,
  settings: Ref<Settings>
) {
  const sources: { [id: string]: AudioBufferSourceNode | null } = {};
  const samplekeys = "qwertyuiopasdfghjklzxcvbnm";

  const keydown = (ev: KeyboardEvent) => {
    const { key } = ev;

    // if modal
    if (ui.value.modal) {
      if (ui.value.modal?.type === "assign") {
        const id = ui.value.modal.value;
        if (id)
          samples.value[key] = {
            key,
            active: true,
            begin: 0,
            bufferid: id,
            held: false,
          };
        ui.value.modal = null;
        return;
      }
      if (ui.value.modal?.type === "copy") {
        if (ui.value.sample && !samples.value[key]?.active) {
          samples.value[key] = { ...ui.value.sample, key };
          ui.value.modal = null;
          ui.value.sample = samples.value[key];
        }
        return;
      }
      if (ui.value.modal?.type === "splice") {
        if (ui.value.sample && !samples.value[key]?.active) {
          const copy = { ...ui.value.sample, key };
          if (copy.end) {
            copy.begin = copy.end;
            copy.end = copy.begin + 0.6;
          }
          samples.value[key] = copy;
          ui.value.modal = null;
          ui.value.sample = samples.value[key];
        }
        return;
      }
    }

    //  play sample

    if (samplekeys.includes(key)) {
      if (ev.ctrlKey) return;
      const sample = samples.value[key];
      if (!sample?.active || sample?.held) return;
      const dur = sample.end ? sample.end - sample.begin : undefined;
      sources[key]?.start(startNow(), sample.begin, dur);
      sample.held = true;
      // open in viz - if viz is empty
      const setAll = settings.value.openView === "always";
      const setAuto = !ui.value.sample?.active && sample.active;
      if (setAll || setAuto) ui.value.sample = sample;
      return;
    }

    // sample edit
    if (ui.value.edit && key.startsWith("Arrow")) {
      const sample = ui.value.sample;
      const edit = ui.value.edit;
      if (!edit || !sample) return;
      const fine = ev.shiftKey ? 0.5 : 1;
      const keyVals: { [k: string]: number } = {
        ArrowUp: 0.01,
        ArrowDown: -0.01,
        ArrowLeft: -0.1,
        ArrowRight: 0.1,
      };
      if (!keyVals[key]) return;
      const buffer = buffers.value[sample.bufferid];

      const pos = sample[edit] ?? 0;
      let next = limit(pos + keyVals[key] * fine, 0, buffer.duration);

      // handle begin / end scrolling past each other
      if (edit === "begin" && sample?.end && next > sample.end)
        sample.end = null;
      if (edit === "end" && next < sample.begin) next = sample.begin;

      sample[edit] = next;
    }

    // close sample
    if (ui.value.sample?.active) {
      if (key === "Escape") {
        ui.value.sample = null;
        ui.value.edit = null;
      }
    }
  };

  const keyup = (ev: KeyboardEvent) => {
    const { key } = ev;
    const sample = samples.value[key];
    if (!sample) return;
    // stop
    sources[key]?.stop();
    sample.held = false;
    if (!sample?.active) return;

    const buffer = buffers.value[sample.bufferid];
    const source = loadAudioSource(buffer, 1.0);
    sources[key] = source;
  };

  onMounted(() => {
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
  });

  watchEffect(() => {
    // auto load samples
    Object.values(samples.value).forEach((sample) => {
      if (!sample) return;
      const buffer = buffers.value[sample.bufferid];
      const source = loadAudioSource(buffer, 1.0);
      sources[sample.key] = source;
    });
  });
}

const createEmpty = () => {
  const empty: SamplesT = {};
  "abcdefghijklmnopqrstuvwxyz".split("").forEach((letter) => {
    empty[letter] = null;
  });
  return empty;
};

export const refSamples = () =>
  cachedRef<SamplesT>("sample-keys", createEmpty());

export const refBuffers = () => ref<BufferState>({});

export const refUi = () =>
  ref<Ui>({
    sample: null,
    modal: null,
    assignBuffer: "",
    edit: null,
    loading: false,
  });

export type Settings = {
  openView: "always" | "auto";
};

export const refSettings = () =>
  cachedRef<Settings>("settings", {
    openView: "always",
  });
