<script setup lang="ts">
import { defineProps, defineEmits, toRefs, computed } from "vue";
import type { BufferState, Ui } from "./hooks";

const props = defineProps(["buffers", "ui"]);
const emit = defineEmits(["assign", "delete"]);
type Props = {
  buffers: BufferState;
  ui: Ui;
};
const { buffers } = toRefs<Props>(props as Props);

const bufferKeys = computed(() =>
  Object.keys(buffers.value).filter((key) => buffers.value[key])
);
</script>
<template>
  <div class="p-4">
    <h2 class="text-xl font-bold">Songs</h2>
    <ul class="list-disc ml-6 space-y-6">
      <li v-for="key in bufferKeys" class="">
        <div>
          {{ key }}
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
      <li v-if="bufferKeys.length === 0">Please load your first audio</li>
    </ul>
  </div>
</template>
