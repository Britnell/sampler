<script setup lang="ts">
import Modal from "./modal.vue";
import Assign from "./assign.vue";
import Loader from "./loader.vue";
import Keyboard from "./keyboard.vue";
import View from "./view.vue";
import Finder from "./find.vue";
import Sequencer from "./sequencer.vue";
import Effects from "./effects.vue";

import { computed, onMounted, onUnmounted, watchEffect } from "vue";
import {
  type SampleT,
  refSamples,
  refBuffers,
  refUi,
  refSettings,
  refTab,
  refEffect,
} from "./hooks";
import { samplesDbRemove } from "./indexdb";
import { clearPassFilter, setPassFilter, enableDelay } from "./audio";

const buffers = refBuffers();
const samples = refSamples();
const ui = refUi();
const settings = refSettings();
const tab = refTab("main");
const effect = refEffect();

const opanModal = (type: string, value?: string) => {
  ui.value.modal = {
    type,
    value,
  };
};

const viewSample = (sample: SampleT | null) => {
  if (!sample) return;
  ui.value.sample = sample;
};

const closeModal = () => (ui.value.modal = null);

const keydown = (ev: KeyboardEvent) => {
  const { key } = ev;

  // if modal
  if (!ui.value.modal) return;

  if (ui.value.modal?.type === "assign") {
    const id = ui.value.modal.value;
    if (!id) return;
    const buffer = buffers.value[id];
    if (!buffer) return;
    samples.value[key] = {
      key,
      begin: 0,
      hold: true,
      bufferid: id,
      speed: 1.0,
      pressed: false,
      mutegroup: undefined,
    };
    closeModal();
    return;
  }
  if (ui.value.modal?.type === "deletebuffer") {
    if (key === "Enter") {
      const id = ui.value.modal.value;
      if (!id) return;
      // remove sample keys
      Object.values(samples.value).map((sample) => {
        if (sample?.bufferid === id) sample = null;
      });
      buffers.value[id] = null;
      samplesDbRemove(id);
      closeModal();
    }
    return;
  }
  if (ui.value.modal?.type === "copy") {
    if (ui.value.sample && !samples.value[key]) {
      samples.value[key] = { ...ui.value.sample, key };
      closeModal();
      ui.value.sample = samples.value[key];
    }
    return;
  }
  if (ui.value.modal?.type === "move") {
    if (ui.value.sample && !samples.value[key]) {
      samples.value[key] = { ...ui.value.sample, key };
      samples.value[ui.value.sample.key] = null;
      closeModal();
      ui.value.sample = samples.value[key];
    }
    return;
  }
  if (ui.value.modal.type === "remove") {
    if (key === ui.value.sample?.key) {
      samples.value[key] = null;
      closeModal();
    }
    return;
  }
  if (ui.value.modal?.type === "splice") {
    if (ui.value.sample && !samples.value[key]) {
      const copy = { ...ui.value.sample, key };
      if (copy.end) {
        copy.begin = copy.end;
        copy.end = copy.begin + 0.6;
      } else copy.begin = copy.begin + 0.6;
      samples.value[key] = copy;
      closeModal();
      ui.value.sample = samples.value[key];
    }
    return;
  }

  if (ui.value.modal?.type === "mutegroup") {
    if (key === "Enter") closeModal();

    const sample = samples.value[key];
    if (!sample) return;
    const group = ui.value.modal.value;
    if (!group) return;
    if (sample.mutegroup === group) sample.mutegroup = undefined;
    else sample.mutegroup = group;
    return;
  }
};

onMounted(() => window.addEventListener("keydown", keydown));

onUnmounted(() => window.removeEventListener("keydown", keydown));

watchEffect(() => {
  const filter = effect.value.filter;
  if (["lowpass", "highpass"].includes(filter.type)) {
    setPassFilter(filter.type as "lowpass", filter.freq);
  } else clearPassFilter();
});

watchEffect(() => {
  const delay = effect.value.delay;
  enableDelay(delay.enabled);
});

const mutegroups = ["A", "B", "C", "D", "E"];

const inModalMutegroup = computed(() => {
  if (ui.value.modal?.type !== "mutegroup") return [];
  const group = ui.value.modal?.value;
  return Object.values(samples.value)
    .filter((s) => s?.mutegroup === group)
    .map((s) => s?.key);
});
</script>
<template>
  <header class="max-w-[1000px] mx-auto px-8">
    <div class=" ">
      <h1 class="text-2xl font-bold py-4">Audio Sampler</h1>
    </div>
    <div class="flex gap-4 border-b border-white">
      <button
        v-for="t in (['main', 'sequencer','filter'] as const)"
        class="border border-white px-2 py-1"
        :class="t === tab ? ' bg-white text-black ' : ''"
        @click="tab = t"
      >
        {{ t }}
      </button>
    </div>
  </header>
  <main class="mt-4 min-h-[calc(100vh-8.5rem)] grid grid-rows-[1fr_auto]">
    <div class="top w-full max-w-[1000px] mx-auto px-8 min-h-0 overflow-auto">
      <div v-if="tab === 'main'" class="view relative">
        <div class="x">
          <Loader :ui="ui" :buffers="buffers" />
          <Assign
            :ui="ui"
            :buffers="buffers"
            @assign="(key) => opanModal('assign', key)"
            @delete="(key) => opanModal('deletebuffer', key)"
          />
          <section class="p-6">
            <h2 class="text-xl font-bold">Mute groups</h2>
            <div>
              <ul class="flex gap-4">
                <li v-for="key in mutegroups" :key="key">
                  <button
                    class="primary px-3"
                    @click="opanModal('mutegroup', key)"
                  >
                    {{ key }}
                  </button>
                </li>
              </ul>
            </div>
          </section>
          <Finder />
        </div>
        <View
          :ui="ui"
          :buffers="buffers"
          :samples="samples"
          @openModal="opanModal"
        />
      </div>
      <div v-if="tab === 'sequencer'" class="seq">
        <Sequencer :ui="ui" :buffers="buffers" :samples="samples" />
      </div>
      <div v-if="tab === 'filter'" class="filter">
        <Effects :effect="effect" />
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
      <Modal :isOpen="ui.modal?.type" @close="ui.modal = null">
        <p v-if="ui.modal?.type === 'assign'">press a key to ASSIGN</p>
        <p v-if="ui.modal?.type === 'copy'">press a key to COPY to</p>
        <p v-if="ui.modal?.type === 'move'">press a key to MOVE to</p>
        <p v-if="ui.modal?.type === 'splice'">press a key to SPLICE to</p>
        <p v-if="ui.modal?.type === 'remove'">confirm key to delete it</p>
        <p v-if="ui.modal?.type === 'deletebuffer'">
          Press ENTER to remove source
        </p>
        <div v-if="ui.modal?.type === 'mutegroup'">
          <p>Add / Remove keys from mutegroup {{ ui.modal.value }}</p>
          <p>{{ inModalMutegroup.join(", ") }}</p>
        </div>
      </Modal>
      <Modal :isOpen="ui.loading">
        <p>LOADING...</p>
      </Modal>
    </section>
  </main>
</template>
