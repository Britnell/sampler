<script setup lang="ts">
import { ref, defineProps, watchEffect, toRefs, computed } from "vue";

const props = defineProps(["sample", "buffer"]);
const { sample, buffer } = toRefs(props);
// const { sample, buffer } = props;
const canvasref = ref<HTMLCanvasElement>();

const findmax = (arr: Float32Array | number[]) => {
  let max = 0;
  arr.forEach((v) => {
    const x = Math.abs(v);
    if (x > max) max = x;
  });
  return max;
};

const wavebuffer = computed(() => {
  const audioData = buffer?.value.getChannelData(0);
  const chunkSize = buffer?.value.sampleRate / 1000;
  const chunks = audioData.length / chunkSize;
  let last = 0;

  const wave = [];
  for (let x = 1; x < chunks; x++) {
    const to = Math.floor(chunkSize * x);
    const slice = audioData.slice(last, to);
    const max = findmax(slice);
    wave.push(max);
    last = to + 1;
  }

  return wave;
});

watchEffect(() => {
  if (!buffer) return;
  const canvas = canvasref.value;
  if (!canvas) return;
  const parent = canvas.parentElement?.getBoundingClientRect();
  if (!parent) return;

  canvas.width = parent.width;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // draf from wavepos - x
  const perc = sample?.value.begin / buffer.value.duration;
  const samplepos = Math.floor(perc * wavebuffer.value.length);
  const W = canvas.width;
  const H = canvas.height;
  const chunkSize = 10;
  const extendLeft = 20;

  // Draw
  ctx.clearRect(0, 0, W, H);
  //  begin line
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#dbdbdb";
  ctx.moveTo(extendLeft, 0);
  ctx.lineTo(extendLeft, H);
  ctx.stroke();
  //
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#282dbd";
  ctx.beginPath();

  for (let x = 0; x < W; x++) {
    const from = samplepos - extendLeft + x * chunkSize;
    const slice = wavebuffer.value.slice(from, from + chunkSize);
    const max = findmax(slice);
    const y = H * (1 - max * 1.0);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
});
</script>

<template>
  <p>VIZ</p>
  <canvas ref="canvasref"></canvas>
</template>
