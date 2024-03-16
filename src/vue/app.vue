<script setup lang="ts">
import {
  useKeyboard,
  type SampleT,
  refSamples,
  refBuffers,
  refUi,
} from "./hooks";
import Modal from "./modal.vue";
import Sampleviz from "./samplewave.vue";
import Assign from "./assign.vue";
import Loader from "./loader.vue";

const buffers = refBuffers();
const samples = refSamples();
const ui = refUi();

useKeyboard(ui, samples, buffers);

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
      <Loader :ui="ui" :buffers="buffers" />
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
