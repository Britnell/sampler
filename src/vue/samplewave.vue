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

const drawFromBegin = (
  width: number,
  height: number,
  start: number,
  stop: number | null
) => {
  const extendLeft = 30;
  const chunkSize = 10;
  if (!ctx) return;
  // style
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#dbdbdb";
  //  begin line
  const startLine = extendLeft;
  ctx.moveTo(startLine, 0);
  ctx.lineTo(startLine, height);
  ctx.stroke();
  if (stop) {
    const stopLine = extendLeft + (stop - start) / chunkSize;
    // draw stop
    ctx.moveTo(stopLine, 0);
    ctx.lineTo(stopLine, height);
    ctx.stroke();
  }

  // wave
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#282dbd";
  ctx.beginPath();
  for (let x = 0; x < width; x++) {
    // average audio wave chunk
    const pos = start + (x - extendLeft) * chunkSize;
    const slice = wavebuffer.value.slice(pos, pos + chunkSize);
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
  if (!canvas || !buffer || !parent || !sample) return;
  canvas.width = parent.width;
  if (!ctx) ctx = canvas.getContext("2d");

  const start = Math.floor(
    (sample.value.begin / buffer.value.duration) * wavebuffer.value.length
  );
  const stop = sample.value.end
    ? Math.floor(
        (sample.value.end / buffer.value.duration) * wavebuffer.value.length
      )
    : null;
  // const edit = ui?.value.edit;
  drawFromBegin(canvas.width, canvas.height, start, stop);
});
</script>

<template>
  <div>
    <canvas ref="canvasref"></canvas>
  </div>
</template>
