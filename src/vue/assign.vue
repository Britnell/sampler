<script setup lang="ts">
import { defineProps, defineEmits, toRefs } from "vue";

const emit = defineEmits(["assign"]);
const props = defineProps(["buffers", "ui"]);
const { ui, buffers } = toRefs(props);
</script>
<template>
  <div>
    <div>
      <label for="samplesel"> Songs: </label>
      <select
        name="samplesel"
        id="samplesel"
        v-model="ui.assignBuffer"
        x-model="ui.assignBuffer"
        class="bg-black"
      >
        <option v-for="k in Object.keys(buffers)" :value="k">
          {{ k }}
        </option>
      </select>
      <button
        @click="() => emit('assign')"
        class="border border-white px-2 py-1"
      >
        assign
      </button>
    </div>
  </div>
</template>
