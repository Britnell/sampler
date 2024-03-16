<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import { useKeyboard, type Ui, type BufferState, type SamplesT } from "./hooks";

const emit = defineEmits(["viewSample"]);

const props = defineProps(["buffers", "ui", "samples"]);

type Props = {
  ui: Ui;
  buffers: BufferState;
  samples: SamplesT;
};

const { ui, buffers, samples } = toRefs<Props>(props as Props);

useKeyboard(ui, samples, buffers);
</script>
<template>
  <section class="w-4/5 wmax-w-[900px] mx-auto">
    <div
      class="flex gap-2"
      v-for="row in ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,.']"
    >
      <button
        class="grow aspect-square border border-white p-2 box-content"
        v-for="k in row"
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
  </section>
</template>
