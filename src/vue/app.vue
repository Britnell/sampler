<script setup lang="ts">
import {
  type SampleT,
  refSamples,
  refBuffers,
  refUi,
  refSettings,
  refTab,
  refEffect,
} from "./hooks";
import Modal from "./modal.vue";
import Assign from "./assign.vue";
import Loader from "./loader.vue";
import Keyboard from "./keyboard.vue";
import View from "./view.vue";
import Finder from "./find.vue";
import Sequencer from "./sequencer.vue";
import { onMounted, onUnmounted, watchEffect } from "vue";
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
    if (id)
      samples.value[key] = {
        key,
        begin: 0,
        bufferid: id,
        held: false,
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
};

onMounted(() => {
  window.addEventListener("keydown", keydown);
  // window.addEventListener("keyup", keyup);
});

onUnmounted(() => {
  window.removeEventListener("keydown", keydown);
  // window.removeEventListener("keyup", keyup);
});

watchEffect(() => {
  const filter = effect.value.filter;
  if (["lowpass", "highpass"].includes(filter.type)) {
    setPassFilter(filter.type as "lowpass", filter.freq);
  } else clearPassFilter();
});

watchEffect(() => {
  const delay = effect.value.delay;
  enableDelay(delay.enabled);
  // if (!delay.enabled) clearDelay();
  // else setDelay(delay.time);
});
</script>
<template>
  <header class="max-w-[1000px] mx-auto px-8">
    <div class=" ">
      <h1 class="text-2xl font-bold py-4">Audio Sampler</h1>
    </div>
    <div class="flex gap-4 mb-8 border-b border-white">
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
  <main class="min-h-[calc(100vh-4rem)] grid grid-rows-[1fr_auto]">
    <div class="top w-full max-w-[1000px] mx-auto px-8">
      <div v-if="tab === 'main'" class="view relative">
        <div class="x">
          <Loader :ui="ui" :buffers="buffers" />
          <Assign
            :ui="ui"
            :buffers="buffers"
            @assign="(key) => opanModal('assign', key)"
            @delete="(key) => opanModal('deletebuffer', key)"
          />
          <section>
            <h2 class="text-xl font-bold">settings</h2>
            <div class="x">
              <label>switch preview window</label>
              {{ settings.openView }}
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
          @openModal="opanModal"
        />
      </div>
      <div v-if="tab === 'sequencer'" class="seq">
        <Sequencer :ui="ui" :buffers="buffers" :samples="samples" />
      </div>
      <div v-if="tab === 'filter'" class="filter">
        <h2>High- / Low-pass</h2>
        <div>
          <select
            :value="effect.filter?.type"
            @input="
              effect.filter = {
                ...effect.filter,
                type: ($event.target as HTMLInputElement).value as
                  | 'lowpass'
                  | 'highpass',
              }
            "
            class="bg-transparent ip primary"
          >
            <option class="text-black" value="none">none</option>
            <option class="text-black" value="lowpass">lowpass</option>
            <option class="text-black" value="highpass">highpass</option>
          </select>
        </div>
        <div>
          <label for=""> Freq : </label>
          <input
            type="number"
            class="bg-transparent w-16"
            :value="effect.filter?.freq"
            @input="
              if (effect.filter)
                effect.filter.freq = +($event.target as HTMLInputElement).value;
            "
          />
          <input
            type="range"
            class="w-[200px]"
            min="20"
            max="20000"
            step="10"
            :value="effect.filter?.freq"
            @input="
              effect.filter.freq = +($event.target as HTMLInputElement).value
            "
          />
        </div>

        <h2>Delay</h2>
        <div>
          <label>
            <input
              type="checkbox"
              :value="effect.delay?.enabled"
              :checked="effect.delay?.enabled"
              @input="
                effect.delay = {
                  ...effect.delay,
                  enabled: ($event.target as HTMLInputElement).checked,
                }
              "
            />
            {{ effect.delay?.enabled ? "ON" : "OFF" }}
          </label>
          <div>
            <label for=""> Delay : </label>
            <input
              type="number"
              class="bg-transparent w-16"
              :value="effect.delay?.time"
              @input="
                if (effect.delay)
                  effect.delay.time = +($event.target as HTMLInputElement)
                    .value;
              "
            />
            <input
              type="range"
              class="w-[200px]"
              min="0.001"
              max="2"
              step="0.001"
              :value="effect.delay?.time"
              @input="
                if (effect.delay)
                  effect.delay.time = +($event.target as HTMLInputElement)
                    .value;
              "
            />
          </div>
        </div>
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
      </Modal>
      <Modal :isOpen="ui.loading">
        <p>LOADING...</p>
      </Modal>
    </section>
  </main>
</template>
