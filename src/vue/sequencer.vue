<script setup lang="ts">
import {
  defineProps,
  toRefs,
  defineEmits,
  ref,
  onMounted,
  onUnmounted,
  computed,
} from "vue";
import { type Ui, type BufferState, type SamplesT } from "./hooks";
import { beep } from "./audio";
import { cachedRef } from "./hooks";
import { playSample, stopSample, stopSampleReload } from "./audio";

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
  startSequencer();
};

const beatTime = (t: number) => {
  if (!state.value.begin) return 0;
  const tbar = 60 / state.value.bpm;
  const total = state.value.bars * tbar;
  const diff = (t - state.value.begin) / 1000;
  const rel = (diff % total) / tbar;
  return rel;
};

const startSequencer = () => {
  const tbar = (60 / state.value.bpm) * 1000;
  let c = 0;

  const timeBarSeqs = () => {
    sequence.value.forEach((seq) => {
      const t = setTimeout(() => {
        const sample = samples.value[seq.key];
        if (!sample) return;
        if (seq.dir === "down") {
          playSample(sample);
        }
        if (seq.dir === "up") {
          const buffer = buffers.value[sample.bufferid];
          stopSampleReload(sample, buffer);
        }
      }, tbar * seq.b);
      cancelTones.set(seq, t);
    });
  };

  const sequencer = () => {
    beep(20, c === 0 ? 1200 : 1000);

    if (c === 0) timeBarSeqs();

    count.value = c + 1;
    c = (c + 1) % state.value.bars;
  };

  sequencer();
  intvl = setInterval(sequencer, tbar);
};

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
  // stopAll()
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
  const sample = samples.value[key];
  if (sample) stopSample(sample);
};
</script>
<template>
  <section>
    <h2 class="text-xl font-bold">Sequencer</h2>
    <div class="my-6 flex gap-6">
      <div>
        <button v-if="!state.active" class="primary" @click="start">
          start
        </button>
        <button v-else class="primary" @click="stop">stop</button>
      </div>
      <p>count : {{ count }}</p>
    </div>
    <div class="x">
      <label>BPM : </label>
      <input
        type="number"
        :value="state.bpm"
        @input="state.bpm = $event.target.value"
        class="bg-transparent w-16"
      />
      <input
        type="range"
        min="40"
        max="140"
        :value="state.bpm"
        @input="state.bpm = $event.target.value"
        class="w-[200px]"
      />
    </div>
    <div class="my-6">
      <h2>Clear keys from sequence</h2>
      <ul class="list-disc ml-6 grid grid-cols-[200px_200px]">
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
