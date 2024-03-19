<script setup lang="ts">
import {
  defineProps,
  toRefs,
  defineEmits,
  ref,
  watchEffect,
  onMounted,
  onUnmounted,
  computed,
} from "vue";
import { type Ui, type BufferState, type SamplesT } from "./hooks";
import { beep } from "./audio";
import { cachedRef } from "./hooks";
import { loadSample, playSample, stopSample } from "./audio";

const emit = defineEmits([""]);

const props = defineProps(["buffers", "ui", "samples"]);

type Props = {
  ui: Ui;
  buffers: BufferState;
  samples: SamplesT;
};

type State = {
  active: boolean;
  recording: boolean;
  begin: null | number;
  bpm: number;
  bars: number;
  quantize: number;
};
const state = ref<State>({
  active: false,
  recording: false,
  begin: null,
  bpm: 90,
  bars: 8,
  quantize: 0.5,
});

const { ui, buffers, samples } = toRefs<Props>(props as Props);

let intvl: number | null;
type Seq = {
  b: number;
  key: string;
  dir: "up" | "down";
};

const sequence = cachedRef<Seq[]>("sequence", []);
const count = ref(0);
const cancelTones = new Map<Seq, number>();

const start = () => {
  state.value = {
    ...state.value,
    active: true,
    begin: Date.now(),
    recording: false,
  };
};

const beatTime = (t: number) => {
  if (!state.value.begin) return 0;

  const tbar = 60 / state.value.bpm;
  const total = state.value.bars * tbar;
  const diff = (t - state.value.begin) / 1000;
  const rel = (diff % total) / tbar;
  return rel;
};

// const quantize = (t: number) => {
//   const rel = beatTime(t);
//   const round = Math.round(rel / state.value.quantize) * state.value.quantize;
//   return round;
// };

watchEffect(() => {
  if (intvl) clearInterval(intvl);
  if (!state.value.active) return;

  const tbar = (60 / state.value.bpm) * 1000;
  let c = 0;

  intvl = setInterval(() => {
    beep(20, c === 0 ? 1200 : 1000);
    if (c === 0) {
      sequence.value.forEach((seq) => {
        const t = setTimeout(() => {
          const sample = samples.value[seq.key];
          if (!sample) return;
          if (seq.dir === "down") {
            // console.log(" PLAY ", seq);
            playSample(sample);
          } else {
            // console.log(" stop", seq);
            stopSample(sample);
            const buffer = buffers.value[sample.bufferid];
            loadSample(sample, buffer);
          }
        }, tbar * seq.b);
        cancelTones.set(seq, t);
      });
    }
    count.value = c + 1;
    c = (c + 1) % state.value.bars;
  }, tbar);
});

const debounce: Record<string, boolean> = {};

const keydown = (ev: KeyboardEvent) => {
  const t = Date.now();
  const { key } = ev;
  if (!state.value.active) return;

  const sample = samples.value[key];

  if (!sample || !sample.active) return;
  if (debounce[key]) return;
  debounce[key] = true;

  const b = beatTime(t);
  sequence.value.push({
    key,
    dir: "down",
    b,
  });
};

const keyup = (ev: KeyboardEvent) => {
  const t = Date.now();
  if (!state.value.active) return;

  const { key } = ev;
  debounce[key] = false;
  const sample = samples.value[key];
  if (!sample || !sample.active) return;

  const b = beatTime(t);
  sequence.value.push({
    key,
    dir: "up",
    b,
  });
};

const cancel = () => {
  if (intvl) clearInterval(intvl);
  [...cancelTones.values()].forEach((t) => clearTimeout(t));
};

onMounted(() => {
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
});

onUnmounted(() => {
  cancel();
  window.removeEventListener("keydown", keydown);
  window.removeEventListener("keyup", keyup);
});

const stop = () => {
  state.value.active = false;
  cancel();
};

const sequenceKeys = computed(() => {
  const keys = new Set<string>();
  sequence.value.forEach((seq) => keys.add(seq.key));
  return [...keys];
});

const clearKey = (key: string) => {
  sequence.value = sequence.value.filter((seq) => seq.key !== key);
};
</script>
<template>
  <section>
    <h2>Sequencer</h2>
    <div>
      <p>count : {{ count }}</p>
    </div>
    <div>
      <button v-if="!state.active" class="primary" @click="start">start</button>
      <button v-else class="primary" @click="stop">stop</button>
    </div>
    <div>
      <h2>Clear keys from sequence</h2>
      <ul class="list-disc ml-6">
        <li v-for="key in sequenceKeys">
          <span>
            {{ key }}
          </span>
          <button class="primary" @click="() => clearKey(key)">clear</button>
        </li>
      </ul>
    </div>
  </section>
</template>
