<script setup lang="ts">
import {
  type SampleT,
  refSamples,
  refBuffers,
  refUi,
  refSettings,
} from "./hooks";
import Modal from "./modal.vue";
import Assign from "./assign.vue";
import Loader from "./loader.vue";
import Keyboard from "./keyboard.vue";
import View from "./view.vue";
import Finder from "./find.vue";

const buffers = refBuffers();
const samples = refSamples();
const ui = refUi();
const settings = refSettings();

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
</script>
<template>
  <header class="max-w-[1000px] mx-auto px-8">
    <h1 class="text-2xl font-bold py-4">Audio Sampler</h1>
  </header>
  <main class="min-h-[calc(100vh-4rem)] grid grid-rows-[1fr_auto]">
    <div class="relative w-full max-w-[1000px] mx-auto px-8">
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
