<script setup lang="ts">
import { type SampleT, refSamples, refBuffers, refUi } from "./hooks";
import Modal from "./modal.vue";
import Assign from "./assign.vue";
import Loader from "./loader.vue";
import Keyboard from "./keyboard.vue";
import View from "./view.vue";

const buffers = refBuffers();
const samples = refSamples();
const ui = refUi();

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
      <View
        :ui="ui"
        :buffers="buffers"
        :samples="samples"
        @removeKey="removeKey"
        @openCopyModal="openCopyModal"
      />
    </div>

    <Keyboard
      :ui="ui"
      :buffers="buffers"
      :samples="samples"
      @viewSample="viewSample"
    />
    <!-- 
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
    </section> -->
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
