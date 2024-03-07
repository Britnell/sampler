<script setup lang="ts">
import { ref, onMounted, watchEffect } from "vue";
import { samplesDbReadAll } from "./indexdb";
import { cachedRef } from "./hooks";

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

const emptyKeys = {
  a: null,
  b: null,
  c: null,
  d: null,
  e: null,
  f: null,
  g: null,
  h: null,
  i: null,
  j: null,
  k: null,
  l: null,
  m: null,
  n: null,
  o: null,
  p: null,
  q: null,
  r: null,
  s: null,
  t: null,
  u: null,
  v: null,
  w: null,
  x: null,
  y: null,
  z: null,
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const buffers = ref<BufferState>({});
const samples = cachedRef<SamplesT>("sample-keys", emptyKeys);

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

const loadBufferId = ref("");
watchEffect(() => {
  console.log("buffers", buffers.value);
  console.log("keys", samples.value);
  console.log("loadid", loadBufferId.value);
});

const addSample = () => {
  console.log("loadid", loadBufferId.value);
  console.log(" LOAD");
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
      <select name="samplesel" id="samplesel" x-model="loadBufferId">
        <option v-for="k in Object.keys(buffers)">
          {{ k }}
        </option>
      </select>
      <button @click="addSample" class="border border-white px-2 py-1">
        Load onto key
      </button>
    </div>
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
