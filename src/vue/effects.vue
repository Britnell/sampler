<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import { type Effect } from "./hooks";

const emit = defineEmits([""]);
const props = defineProps(["effect"]);

type Props = {
  effect: Effect;
};
const { effect } = toRefs<Props>(props as Props);
</script>

<template>
  <section class="space-y-8">
    <div class="border-l border-white p-6">
      <h2 class="text-xl font-bold">High- / Low-pass</h2>
      <div>
        <select
          :value="effect.filter?.type"
          @input="
            effect.filter = {
              ...effect.filter,
              type: ($event.target as HTMLInputElement).value as
                | 'lowpass'
                | 'highpass',
            }
          "
          class="bg-transparent ip primary"
        >
          <option class="text-black" value="none">none</option>
          <option class="text-black" value="lowpass">lowpass</option>
          <option class="text-black" value="highpass">highpass</option>
        </select>
      </div>
      <div class="flex gap-3">
        <label for=""> Freq : </label>
        <input
          type="number"
          class="bg-transparent w-16"
          :value="effect.filter?.freq"
          @input="
            if (effect.filter)
              effect.filter.freq = +($event.target as HTMLInputElement).value;
          "
        />
        <input
          type="range"
          class="w-[200px]"
          min="20"
          max="20000"
          step="10"
          :value="effect.filter?.freq"
          @input="
            effect.filter.freq = +($event.target as HTMLInputElement).value
          "
        />
      </div>
    </div>

    <div class="border-l border-white p-6">
      <h2 class="text-xl font-bold">Delay</h2>
      <div>
        <label>
          <input
            type="checkbox"
            :value="effect.delay?.enabled"
            :checked="effect.delay?.enabled"
            @input="
              effect.delay = {
                ...effect.delay,
                enabled: ($event.target as HTMLInputElement).checked,
              }
            "
          />
          {{ effect.delay?.enabled ? "ON" : "OFF" }}
        </label>
        <div class="flex gap-3">
          <label for=""> Delay : </label>
          <input
            type="number"
            class="bg-transparent w-16"
            :value="effect.delay?.time"
            @input="
              if (effect.delay)
                effect.delay.time = +($event.target as HTMLInputElement).value;
            "
          />
          <input
            type="range"
            class="w-[200px]"
            min="0.001"
            max="2"
            step="0.001"
            :value="effect.delay?.time"
            @input="
              if (effect.delay)
                effect.delay.time = +($event.target as HTMLInputElement).value;
            "
          />
        </div>
      </div>
    </div>
  </section>
</template>
