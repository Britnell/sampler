<script setup lang="ts">
import { ref, defineProps, watchEffect, toRefs, computed } from "vue";

const props = defineProps(["sample", "buffer", "ui"]);
const { sample, buffer, ui } = toRefs(props);
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

  const wave = [];
  let last = 0;
  for (let x = 1; x < chunks; x++) {
    const to = Math.floor(chunkSize * x);
    const slice = audioData.slice(last, to);
    const max = findmax(slice);
    wave.push(max);
    last = to + 1;
  }

  return wave;
});

let ctx: null | CanvasRenderingContext2D;

const drawBegin = (width: number, height: number, start: number) => {
  const extendLeft = 30;
  const chunkSize = 10;
  if (!ctx) return;
  //  begin line
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#dbdbdb";
  ctx.moveTo(extendLeft, 0);
  ctx.lineTo(extendLeft, height);
  ctx.stroke();
  //
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#282dbd";
  ctx.beginPath();
  for (let x = 0; x < width; x++) {
    // average audio wave chunk
    const from = start + (x - extendLeft) * chunkSize;
    const slice = wavebuffer.value.slice(from, from + chunkSize);
    const max = findmax(slice);
    const y = height * (1 - max * 1.0);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

watchEffect(() => {
  const canvas = canvasref.value;
  const parent = canvas?.parentElement?.getBoundingClientRect();
  if (!canvas || !buffer || !parent) return;
  canvas.width = parent.width;
  if (!ctx) ctx = canvas.getContext("2d");

  // draf from wavepos - x
  const begin = sample?.value.begin;
  const perc = begin / buffer.value.duration;
  const start = Math.floor(perc * wavebuffer.value.length);
  const edit = ui?.value.edit;
  // console.log({ begin, start, edit });

  drawBegin(canvas.width, canvas.height, start);

  // Draw
});
</script>

<template>
  <p>VIZ</p>
  <canvas ref="canvasref"></canvas>
</template>
