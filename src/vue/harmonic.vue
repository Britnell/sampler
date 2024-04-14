<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { playHarmonic } from "./audio";

const props = defineProps(["harmonic", "samples", "buffers"]);
const emit = defineEmits(["select"]);

const pitches = {
  q: 0,
  w: 1,
  e: 2,
  r: 3,
  t: 4,
  y: 5,
  u: 6,
  i: 7,
  o: 8,
  p: 9,
  "1": 10,
  "2": 11,
  "3": 12,
  "4": 13,
  "5": 14,
  "6": 15,
  "7": 16,
  "8": 17,
  "9": 18,
  "0": 19,
  a: -9,
  s: -8,
  d: -7,
  f: -6,
  g: -5,
  h: -4,
  j: -3,
  k: -2,
  l: -1,
  ".": -10,
  ",": -11,
  m: -12,
  n: -13,
  b: -14,
  v: -15,
  c: -16,
  x: -17,
  z: -18,
};

const pressed: { [key: string]: boolean } = {};

const keydown = (ev: KeyboardEvent) => {
  const { key } = ev;

  //   play
  if (props.harmonic) {
    if (key === "Escape") {
      emit("select", null);
      return;
    }

    const sample = props.samples[props.harmonic];
    if (sample) {
      if (pressed[key]) return;

      const buffer = props.buffers[sample.bufferid];
      const pitch = pitches[key as keyof typeof pitches];

      if (pitch !== undefined) playHarmonic(sample, buffer, pitch, key);
      pressed[key] = true;
    }

    return;
  }

  //   select
  const sample = props.samples[key];
  if (sample) emit("select", key);
};

const keyup = (ev: KeyboardEvent) => {
  const { key } = ev;
  //   console.log(key);
  pressed[key] = false;
};

onMounted(() => {
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
});

onUnmounted(() => {
  window.removeEventListener("keydown", keydown);
  window.removeEventListener("keyup", keyup);
});

//
</script>
<template>
  <p>Harmonic {{ props.harmonic }}</p>
</template>
