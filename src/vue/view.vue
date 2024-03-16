<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import { type Ui, type BufferState, type SamplesT } from "./hooks";
import Sampleviz from "./samplewave.vue";

const emit = defineEmits(["removeKey", "openCopyModal", "openSpliceModal"]);

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
    <Sampleviz
      :buffer="buffers[ui.sample.bufferid]"
      :sample="ui.sample"
      :ui="ui"
    />
    <div class="flex justify-between">
      <div>
        <button v-if="ui.edit === 'begin'" @click="ui.edit = null">
          finish
        </button>
        <button v-else @click="ui.edit = 'begin'">Edit begin</button>
      </div>
      <div>
        <button
          v-if="!ui.sample.end"
          @click="ui.sample.end = ui.sample.begin + 0.5"
        >
          add end
        </button>
        <button v-else-if="ui.edit === 'end'" @click="ui.edit = null">
          finish
        </button>
        <div v-else class="flex flex-col gap-2">
          <button @click="ui.edit = 'end'">Edit End</button>
          <button @click="ui.sample.end = null">Remove end</button>
        </div>
      </div>
    </div>
    <div class="flex gap-4">
      <button @click="emit('openCopyModal')">copy</button>
      <button @click="emit('openSpliceModal')">splice</button>
    </div>
  </section>
</template>
