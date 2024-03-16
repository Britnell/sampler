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
  <div>
    <h2>Songs</h2>
    <div v-for="key in Object.keys(buffers)">
      <div class="flex">
        <p>
          {{ key }}
        </p>
        <button @click="() => emit('assign', key)" class="primary">load</button>
      </div>
    </div>
  </div>
</template>
