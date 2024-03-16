<script setup lang="ts">
import { defineProps, defineEmits, toRefs, onMounted } from "vue";
import { loadFileBuffer } from "./audio";
import { samplesDbWrite } from "./indexdb";
import { loadCachedSamples } from "./lib";

// const emit = defineEmits([]);

const props = defineProps(["buffers", "ui"]);
const { ui, buffers } = toRefs(props);

onMounted(async () => {
  console.log(ui, buffers);

  if (!ui || !buffers) return;
  // Load cache
  ui.value.loading = true;
  const srcs = await loadCachedSamples();
  // if (srcs) buffers.value = srcs;
  if (srcs)
    Object.entries(srcs).map(([name, buffer]) => {
      buffers.value[name] = buffer;
    });
  ui.value.loading = false;
});

const loadFile = async (file: File | undefined) => {
  if (!file || !buffers || !ui) return;
  // setLoading(true);
  ui.value.loading = true;

  // read
  const buffer = await loadFileBuffer(file);
  if (buffer) buffers.value[file.name] = buffer;
  // cache
  const blob = new Blob([file], { type: file.type });
  await samplesDbWrite(blob, file.name).catch((err) => console.error(err));
  ui.value.loading = false;
};

const fileSelect = (ev: Event) => {
  const ip = ev.target as HTMLInputElement;
  loadFile(ip.files?.[0]);
};
</script>
<template>
  <h2>load audio</h2>
  <div className=" grid grid-cols-3 gap-10">
    <label>
      <span className=" mb-3 block">load local file :</span>
      <input type="file" accept="audio/mp3" @change="fileSelect" />
    </label>
  </div>
</template>
