<script setup lang="ts">
import { ref, onMounted, watchEffect } from "vue";
import { samplesDbReadAll } from "./indexdb";
import { cachedRef } from "./hooks";
import Modal from "./modal.vue";

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
  begin: number;
  active: boolean;
  bufferid: string;
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

onMounted(async () => {
  const blobs = await samplesDbReadAll().catch((e) => console.error(e));
  if (!blobs) return;
  const srcs: BufferState = {};
  //   setLoading(true);
  await Promise.all(
    Object.entries(blobs).map(async ([name, blob]) => {
      // load array from blob
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = await audioContext
        .decodeAudioData(arrayBuffer)
        .catch((err) => console.error("err decode", err, name));
      if (!buffer) return;
      srcs[name] = buffer;
      return buffer;
    })
  );
  buffers.value = srcs;
});

const modal = ref<{ type?: string; value?: string }>({});
const loadBufferId = ref("");

watchEffect(() => {
  // console.log("buffers", buffers.value);
  // console.log("keys", samples.value);
  console.log("modal", modal.value);
});

const addSample = () => {
  modal.value = {
    type: "assign",
  };
  console.log("loadid", loadBufferId.value);
};

// const keyboard = ;
</script>
<template>
  <h1>Audio Sampler</h1>
  <p>lorem</p>
  <div>
    load buffer onto key : {{ loadBufferId }}
    <div>
      <label for="samplesel"> Songs: </label>
      <select
        name="samplesel"
        id="samplesel"
        v-model="loadBufferId"
        class="bg-black"
      >
        <option v-for="k in Object.keys(buffers)" :value="k">
          {{ k }}
        </option>
      </select>
      <button @click="addSample" class="border border-white px-2 py-1">
        assign
      </button>
    </div>
  </div>
  <div>
    <p :class="modal.type === 'assign' ? 'a' : 'b'">sadasd</p>
    <Modal :isOpen="modal.type === 'assign'" @close="modal = {}" />
  </div>
  <div>
    <div
      class="flex gap-2"
      v-for="row in ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,.']"
    >
      <div class="grow aspect-square border border-white p-2" v-for="k in row">
        <div v-if="samples[k]">
          {{ JSON.stringify(samples[k]) }}
        </div>
        <span>{{ k }}</span>
      </div>
    </div>

    <!-- <div v-for="([k, key], i) in Object.entries(samples)">
      {{ i }}{{ k }} - {{ JSON.stringify(key) }}
    </div> -->
  </div>
</template>
