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

const rows = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

const { ui, buffers, samples, settings } = toRefs<Props>(props as Props);

useKeyboard(ui, samples, buffers, settings);
</script>

<template>
  <section class="flex justify-center">
    <div class="mb-4 flex flex-col gap-1">
      <div
        v-for="(row, i) in rows"
        class="flex gap-1 ml-3 translate-x-[calc(var(--x)*1rem)]"
        :style="'--x:' + i"
      >
        <button
          v-for="k in row"
          class="flex-initial w-[min(5vw,64px)] h-[min(5vw,64px)] aspect-square border border-white p-2 box-content"
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
