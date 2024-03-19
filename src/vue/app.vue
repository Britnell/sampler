<script setup lang="ts">
import {
  type SampleT,
  refSamples,
  refBuffers,
  refUi,
  refSettings,
  refTab,
} from "./hooks";
import Modal from "./modal.vue";
import Assign from "./assign.vue";
import Loader from "./loader.vue";
import Keyboard from "./keyboard.vue";
import View from "./view.vue";
import Finder from "./find.vue";
import Sequencer from "./sequencer.vue";
import { onMounted, onUnmounted } from "vue";

const buffers = refBuffers();
const samples = refSamples();
const ui = refUi();
const settings = refSettings();
const tab = refTab("main");

const openSampleModal = (val: string) => {
  ui.value.modal = {
    type: "assign",
    value: val,
  };
};
const openSpliceModal = () => {
  ui.value.modal = {
    type: "splice",
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

const keydown = (ev: KeyboardEvent) => {
  const { key } = ev;

  // if modal
  if (!ui.value.modal) return;

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
};

onMounted(() => {
  window.addEventListener("keydown", keydown);
  // window.addEventListener("keyup", keyup);
});

onUnmounted(() => {
  window.removeEventListener("keydown", keydown);
  // window.removeEventListener("keyup", keyup);
});
</script>
<template>
  <header class="max-w-[1000px] mx-auto px-8">
    <div class=" ">
      <h1 class="text-2xl font-bold py-4">Audio Sampler</h1>
    </div>
    <div class="flex gap-4 mb-8 border-b border-white">
      <button
        v-for="t in (['main', 'sequencer'] as const)"
        class="border border-white px-2 py-1"
        :class="t === tab ? ' bg-white text-black ' : ''"
        @click="tab = t"
      >
        {{ t }}
      </button>
    </div>
  </header>
  <main class="min-h-[calc(100vh-4rem)] grid grid-rows-[1fr_auto]">
    <div class="top w-full max-w-[1000px] mx-auto px-8">
      <div v-if="tab === 'main'" class="view relative">
        <div class="x">
          <Loader :ui="ui" :buffers="buffers" />
          <Assign :ui="ui" :buffers="buffers" @assign="openSampleModal" />
          <section>
            <h2 class="text-xl font-bold">settings</h2>
            <div class="x">
              <label>switch preview window</label>
              <select
                class="bg-transparent ip primary"
                x-model="settings.openView"
              >
                <option
                  v-for="opt in ['always', 'auto']"
                  :value="opt"
                  class="text-black"
                >
                  {{ opt }}
                </option>
              </select>
            </div>
          </section>
          <Finder />
        </div>
        <View
          :ui="ui"
          :buffers="buffers"
          :samples="samples"
          @removeKey="removeKey"
          @openCopyModal="openCopyModal"
          @openSpliceModal="openSpliceModal"
        />
      </div>
      <div v-if="tab === 'sequencer'" class="seq">
        <Sequencer :ui="ui" :buffers="buffers" :samples="samples" />
      </div>
    </div>

    <Keyboard
      :ui="ui"
      :buffers="buffers"
      :samples="samples"
      :settings="settings"
      @viewSample="viewSample"
    />
    <section>
      <Modal :isOpen="ui.modal?.type === 'assign'" @close="ui.modal = null">
        <p>press a key to assign</p>
      </Modal>
      <Modal :isOpen="ui.modal?.type === 'copy'" @close="ui.modal = null">
        <p>press a key to copy to</p>
      </Modal>
      <Modal :isOpen="ui.modal?.type === 'splice'" @close="ui.modal = null">
        <p>press a key to splice to</p>
      </Modal>
      <Modal :isOpen="ui.loading">
        <p>LOADING...</p>
      </Modal>
    </section>
  </main>
</template>
