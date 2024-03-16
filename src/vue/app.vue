<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from "vue";
import { cachedRef } from "./hooks";
import Modal from "./modal.vue";
import Sampleviz from "./samplewave.vue";
import { loadSource } from "../react/loader";
import { loadCachedSamples, limit } from "./lib";
import Assign from "./assign.vue";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
export type BufferState = { [name: string]: AudioBuffer };

export type SampleT = {
  key: string;
  bufferid: string;
  active: boolean;
  held: boolean;
  begin: number;
  end?: number;
};
export type SamplesT = {
  [id: string]: SampleT | null;
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
  sample: SampleT | null;
  modal: { type: string; value?: string } | null;
  assignBuffer: string;
  edit: "begin" | "end" | null;
  loading: boolean;
}>({
  sample: null,
  modal: null,
  assignBuffer: "",
  edit: null,
  loading: false,
});

onMounted(async () => {
  // set loading state
  ui.value.loading = true;
  const _src = await loadCachedSamples();
  if (_src) buffers.value = _src;
  ui.value.loading = false;
});

const sources: { [id: string]: AudioBufferSourceNode | null } = {};

const samplekeys = "qwertyuiopasdfghjklzxcvbnm";

const keydown = (ev: KeyboardEvent) => {
  const { key } = ev;

  // first modal
  if (ui.value.modal) {
    if (ui.value.modal?.type === "assign") {
      samples.value[key] = {
        key,
        active: true,
        begin: 0,
        bufferid: ui.value.assignBuffer,
        held: false,
      };
      ui.value.modal = null;
      return;
    }
    if (ui.value.modal?.type === "copy") {
      if (ui.value.sample && !samples.value[key]?.active) {
        samples.value[key] = { ...ui.value.sample, key };
        ui.value.modal = null;
        return;
      }
      return;
    }
  }

  //  play sample
  if (samplekeys.includes(key)) {
    const sample = samples.value[key];
    if (!sample?.active || sample?.held) return;
    sources[key]?.start(audioContext.currentTime, sample.begin);
    sample.held = true;
    // open in viz - if viz is empty
    if (!ui.value.sample) viewSample(samples.value[key]);
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
    let next = sample.begin + keyVals[key] * fine;
    if (next < 0) next = 0;
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

const viewSample = (sample: SampleT | null) => {
  if (!sample?.active) return;
  ui.value.sample = sample;
};

const removeKey = () => {
  if (ui.value.sample) ui.value.sample.active = false;
};

const openCopyModal = () => {
  ui.value.modal = {
    type: "copy",
  };
};
</script>
<template>
  <header>
    <h1 class="h-10">Audio Sampler</h1>
  </header>
  <main class="min-h-[calc(100vh-2.5rem)] grid grid-rows-[1fr_auto]">
    <div class="relative">
      <Assign :ui="ui" :buffers="buffers" @assign="openSampleModal" />
      <section
        class="view absolute inset-0 bg-[var(--bg)]"
        v-if="ui.sample?.active"
      >
        <div class="flex justify-between">
          <h2 class="text-2xl">{{ ui.sample.key }}</h2>
          <button @click="ui.sample = null">Close</button>
        </div>
        <p>{{ ui.sample?.bufferid }}</p>
        <div>
          <button @click="removeKey">remove</button>
        </div>
        <Sampleviz :buffer="buffers[ui.sample.bufferid]" :sample="ui.sample" />
        <div class="flex justify-between">
          <div>
            <button v-if="ui.edit === 'begin'" @click="ui.edit = null">
              finish
            </button>
            <button v-else @click="ui.edit = 'begin'">Edit begin</button>
          </div>
          <div>
            <button v-if="ui.edit === 'end'" @click="ui.edit = null">
              finish
            </button>
            <button v-else @click="ui.edit = 'end'">Edit End</button>
          </div>
        </div>
        <div class="flex">
          <button @click="openCopyModal">copy</button>
        </div>
      </section>
    </div>

    <section class="w-4/5 wmax-w-[900px] mx-auto">
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
    <section>
      <Modal :isOpen="ui.modal?.type === 'assign'" @close="ui.modal = null">
        <p>press a key to assign</p>
      </Modal>
      <Modal :isOpen="ui.modal?.type === 'copy'" @close="ui.modal = null">
        <p>press a key to copy to</p>
      </Modal>
      <Modal :isOpen="ui.loading">
        <p>LOADING...</p>
      </Modal>
    </section>
  </main>
</template>
