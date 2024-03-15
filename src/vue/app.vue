<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from "vue";
import { cachedRef } from "./hooks";
import Modal from "./modal.vue";
import Sampleviz from "./samplewave.vue";
import { loadSource } from "../react/loader";
import { loadCachedSamples } from "./lib";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
export type BufferState = { [name: string]: AudioBuffer };
export type SamplesT = {
  [id: string]: SampleT | null;
};
export type SampleT = {
  key: string;
  bufferid: string;
  active: boolean;
  held: boolean;
  begin: number;
};

const createEmpty = () => {
  const empty: SamplesT = {};
  "abcdefghijklmnopqrstuvwxyz".split("").forEach((letter) => {
    empty[letter] = null;
  });
  return empty;
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const buffers = ref<BufferState>({});
const samples = cachedRef<SamplesT>("sample-keys", createEmpty());
//
const ui = ref<{
  view: SampleT | null;
  modal: { type: string; value?: string } | null;
  assignBuffer: string;
}>({
  view: null,
  modal: null,
  assignBuffer: "",
});

onMounted(async () => {
  // set loading state
  const _src = await loadCachedSamples();
  if (_src) buffers.value = _src;
});

const sources: { [id: string]: AudioBufferSourceNode | null } = {};

const keydown = (ev: KeyboardEvent) => {
  const { key } = ev;

  //  play sample
  const sample = samples.value[key];
  if (sample) {
    if (!sample.active) return;
    if (sample?.held) return;
    sources[key]?.start(audioContext.currentTime, sample.begin);
    sample.held = true;
    return;
  }

  console.log("down", key);

  if (ui.value.view?.active) {
    if (key === "Escape") ui.value.view = null;
  }
};

const keyup = (ev: KeyboardEvent) => {
  const { key } = ev;
  const sample = samples.value[key];
  if (!sample) return;
  sample.held = false;
  if (!sample?.active) return;

  // console.log(" up ", ev);
  sources[key]?.stop();
  const buffer = buffers.value[sample.bufferid];
  const source = loadSource(buffer, 1.0);
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

// watcheffect( ()=>) load sample sources on change

watchEffect(() => {
  // console.log("buffers", buffers.value);
  // console.log("samples", samples.value);
  // console.log("modal", modal.value);
});

const openSampleModal = () => {
  ui.value.modal = {
    type: "assign",
  };
};

const assignKey = ({ key }: KeyboardEvent) => {
  if (ui.value.modal?.type !== "assign") return;
  // console.log(key, ui.value.assignBuffer);
  samples.value[key] = {
    key,
    active: true,
    begin: 0,
    bufferid: ui.value.assignBuffer,
    held: false,
  };
  ui.value.modal = null;
};

const viewSample = (sample: SampleT | null) => {
  if (!sample?.active) return;
  const smp = samples.value[sample.key];
  if (smp?.active) {
    ui.value.view = smp;
  }
};

const removeKey = () => {
  if (ui.value.view) ui.value.view.active = false;
};
</script>
<template>
  <header>
    <h1 class="h-10">Audio Sampler</h1>
  </header>
  <main
    class="min-h-[calc(100vh-2.5rem)] grid grid-rows-[1fr_minmax(400px,auto)]"
  >
    <div class="relative">
      <section class="loader">
        <div>
          <div>
            <label for="samplesel"> Songs: </label>
            <select
              name="samplesel"
              id="samplesel"
              v-model="ui.assignBuffer"
              class="bg-black"
            >
              <option v-for="k in Object.keys(buffers)" :value="k">
                {{ k }}
              </option>
            </select>
            <button
              @click="openSampleModal"
              class="border border-white px-2 py-1"
            >
              assign
            </button>
          </div>
        </div>
      </section>

      <section
        class="view absolute inset-0 bg-[var(--bg)]"
        v-if="ui.view?.active"
      >
        <div class="flex justify-between">
          <h2 class="text-2xl">{{ ui.view.key }}</h2>
          <button @click="ui.view = null">Close</button>
        </div>
        <p>{{ ui.view?.bufferid }} @{{ ui.view?.begin }}</p>
        <div>
          <button @click="removeKey">remove</button>
        </div>
        <Sampleviz :buffer="buffers[ui.view.bufferid]" :sample="ui.view" />
      </section>
    </div>

    <section>
      <div
        class="flex gap-2"
        v-for="row in ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,.']"
      >
        <button
          class="grow aspect-square border border-white p-2 box-content"
          v-for="k in row"
          :class="
            samples[k]?.held
              ? ' bg-blue-400 bg-opacity-50'
              : samples[k]?.active
              ? ' bg-white bg-opacity-10 '
              : ''
          "
          @click="viewSample(samples[k])"
        >
          {{ k }}
        </button>
      </div>
    </section>
    <div>
      <Modal
        :isOpen="ui.modal?.type === 'assign'"
        @close="ui.modal = null"
        @keypress="assignKey"
      >
        <p>press a key to assign</p>
      </Modal>
    </div>
  </main>
</template>
