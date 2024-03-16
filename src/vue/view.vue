<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import { type Ui, type BufferState, type SamplesT } from "./hooks";
import Sampleviz from "./samplewave.vue";

const emit = defineEmits(["removeKey", "openCopyModal"]);

const props = defineProps(["buffers", "ui", "samples"]);

type Props = {
  ui: Ui;
  buffers: BufferState;
  samples: SamplesT;
};

const { ui, buffers } = toRefs<Props>(props as Props);
</script>
<template>
  <section
    class="view absolute inset-0 bg-[var(--bg)]"
    v-if="ui.sample?.active"
  >
    <div class="flex justify-between">
      <h2 class="text-2xl">{{ ui.sample.key }}</h2>
      <button @click="ui.sample = null">Close</button>
    </div>
    <p>{{ ui.sample?.bufferid }}</p>
    <div>
      <button @click="emit('removeKey')">remove</button>
    </div>
    <Sampleviz :buffer="buffers[ui.sample.bufferid]" :sample="ui.sample" />
    <div class="flex justify-between">
      <div>
        <button v-if="ui.edit === 'begin'" @click="ui.edit = null">
          finish
        </button>
        <button v-else @click="ui.edit = 'begin'">Edit begin</button>
      </div>
      <div>
        <button v-if="ui.edit === 'end'" @click="ui.edit = null">finish</button>
        <button v-else @click="ui.edit = 'end'">Edit End</button>
      </div>
    </div>
    <div class="flex">
      <button @click="emit('openCopyModal')">copy</button>
    </div>
  </section>
</template>
