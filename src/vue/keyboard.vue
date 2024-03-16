<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import {
  useKeyboard,
  type Ui,
  type BufferState,
  type SamplesT,
  type Settings,
} from "./hooks";

const emit = defineEmits(["viewSample"]);

const props = defineProps(["buffers", "ui", "samples", "settings"]);

type Props = {
  ui: Ui;
  buffers: BufferState;
  samples: SamplesT;
  settings: Settings;
};

const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm,./"];

const { ui, buffers, samples, settings } = toRefs<Props>(props as Props);

useKeyboard(ui, samples, buffers, settings);
</script>

<template>
  <section class="flex justify-center">
    <div class="mb-4 flex flex-col gap-2">
      <div v-for="row in rows" class="flex gap-2 ml-3 first:ml-0 last:ml-6">
        <button
          v-for="k in row"
          class="flex-initial w-[min(6vw,100px)] h-[min(6vw,100px)] aspect-square border border-white p-2 box-content"
          :class="
            samples[k]?.held
              ? ' bg-blue-400 bg-opacity-50'
              : samples[k]?.active
              ? ' bg-white bg-opacity-10 '
              : ''
          "
          @click="emit('viewSample', samples[k])"
        >
          {{ k }}
        </button>
      </div>
    </div>
  </section>
</template>
