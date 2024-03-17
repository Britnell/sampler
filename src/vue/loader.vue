<script setup lang="ts">
import { defineProps, toRefs, onMounted, ref } from "vue";
import { loadFileBuffer, loadUriBuffer } from "./audio";
import { samplesDbWrite } from "./indexdb";
import { loadCachedSamples } from "./lib";
// const emit = defineEmits([]);

const props = defineProps(["buffers", "ui"]);
const { ui, buffers } = toRefs(props);

onMounted(async () => {
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

const loadUri = async (uri: string) => {
  if (!buffers || !ui) return;

  ui.value.loading = true;
  const { blob, audioBuffer } = await loadUriBuffer(uri);
  if (audioBuffer) buffers.value[uri] = audioBuffer;

  if (blob) await samplesDbWrite(blob, uri).catch((err) => console.error(err));
  ui.value.loading = false;
};
const loadFromUrl = (ev: Event) => {
  const uri = (ev.target as HTMLFormElement).url?.value;
  if (uri) loadUri(uri);
};
</script>
<template>
  <div class="">
    <div class="border border-white p-4">
      <h2 class="text-xl font-bold">load audio</h2>
      <div className=" grid grid-cols-3 gap-10 ">
        <div class="">
          <label className=" mb-3 block" for="fileip">load local file :</label>
          <input
            id="fileip"
            type="file"
            accept="audio/mp3"
            @change="fileSelect"
          />
        </div>
        <div class="">
          <label for="urlip" className=" mb-3 block">load from url :</label>
          <form @submit.prevent="loadFromUrl">
            <input
              id="urlip"
              type="text"
              name="url"
              className=" bg-transparent border border-[var(--b2)] "
            />
            <button className="primary ">load</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
