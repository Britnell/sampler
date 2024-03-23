import {
  ref,
  onMounted,
  onUnmounted,
  watchEffect,
  type UnwrapRef,
  type Ref,
} from "vue";
import {
  loadSample,
  playSample,
  stopAllSamples,
  stopMutegroup,
  stopSampleReload,
} from "./audio";
import { limit } from "./lib";

export type BufferState = { [name: string]: AudioBuffer | null };

export type SampleT = {
  key: string;
  bufferid: string;
  pressed: boolean;
  begin: number;
  end?: number | null;
  hold: boolean;
  mutegroup?: string;
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

const samplekeys =
  "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
export const isSampleKey = (key: string) => samplekeys.includes(key);

export function useKeyboard(
  ui: Ref<Ui>,
  samples: Ref<SamplesT>,
  buffers: Ref<BufferState>,
  settings: Ref<Settings>
) {
  const keydown = (ev: KeyboardEvent) => {
    const { key } = ev;

    // modal keys are handled elsewhere
    if (ui.value.modal) return;

    //  play sample
    if (isSampleKey(key)) {
      if (ev.ctrlKey) return;
      const sample = samples.value[key];
      if (!sample || sample?.pressed) return;

      const buffer = buffers.value[sample.bufferid];
      playSample(sample, buffer);
      stopMutegroup(sample, samples.value, buffers.value);

      sample.pressed = true;
      ui.value.sample = sample;
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
      if (!buffer) return;

      const pos = sample[edit] ?? 0;
      let next = limit(pos + keyVals[key] * fine, 0, buffer.duration);

      // handle begin / end scrolling past each other
      if (edit === "begin" && sample?.end && next > sample.end)
        sample.end = null;
      if (edit === "end" && next < sample.begin) next = sample.begin;

      sample[edit] = next;
      ev.preventDefault();
    }

    // close sample
    if (ui.value.sample) {
      if (key === "Escape") {
        ui.value.sample = null;
        ui.value.edit = null;
      }
    }

    if (key === " ") {
      stopAllSamples(samples.value, buffers.value);
      ev.preventDefault();
    }
  };

  const keyup = (ev: KeyboardEvent) => {
    const { key } = ev;
    // clear & reload
    const sample = samples.value[key];
    if (!sample) return;
    if (!sample.hold) {
      const buffer = buffers.value[sample.bufferid];
      stopSampleReload(sample, buffer);
    }
    sample.pressed = false;
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
      if (!buffer) return;
      loadSample(sample, buffer);
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

type Tabs = "main" | "view" | "sequencer" | "filter" | null;
export const refTab = (initial: Tabs) => ref<Tabs>(initial);

export type Effect = {
  filter: {
    type: "lowpass" | "highpass" | "none";
    freq: number;
  };
  delay: {
    enabled: boolean;
    time: number;
    feedback: number;
    dry: number;
    wet: number;
  };
};

export const refEffect = () =>
  cachedRef<Effect>("filter", {
    filter: {
      type: "none",
      freq: 500,
    },
    delay: {
      enabled: true,
      time: 0.2,
      feedback: 0.5,
      dry: 0.5,
      wet: 0.5,
    },
  });
