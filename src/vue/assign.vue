<script setup lang="ts">
import { defineProps, defineEmits, toRefs } from "vue";
import type { BufferState, Ui } from "./hooks";

const emit = defineEmits(["assign"]);
const props = defineProps(["buffers", "ui"]);
type Props = {
  buffers: BufferState;
  ui: Ui;
};
const { buffers } = toRefs<Props>(props as Props);
</script>
<template>
  <div class="p-4">
    <h2 class="text-xl font-bold">Songs</h2>
    <ul class="list-disc ml-6 space-y-2">
      <li v-for="key in Object.keys(buffers)" class="flex items-center">
        <span>
          {{ key }}
        </span>
        <button @click="() => emit('assign', key)" class="primary ml-4 py-0">
          assign
        </button>
      </li>
    </ul>
  </div>
</template>
