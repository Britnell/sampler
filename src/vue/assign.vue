<script setup lang="ts">
import { defineProps, defineEmits, toRefs } from "vue";
import type { BufferState, Ui } from "./hooks";

const props = defineProps(["buffers", "ui"]);
const emit = defineEmits(["assign", "delete"]);
type Props = {
  buffers: BufferState;
  ui: Ui;
};
const { buffers } = toRefs<Props>(props as Props);
</script>
<template>
  <div class="p-4">
    <h2 class="text-xl font-bold">Songs</h2>
    <ul class="list-disc ml-6 space-y-6">
      <li v-for="key in Object.keys(buffers)" class="">
        <div>
          {{ key }}
        </div>
        <div class="flex gap-4">
          <label>Speed: x2</label>
          <input type="range" name="speed" min="0.5" max="2" step="0.1" />
        </div>
        <div class="flex gap-3">
          <button @click="() => emit('delete', key)" class="primary py-0">
            delete
          </button>
          <button @click="() => emit('assign', key)" class="primary py-0">
            assign
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
