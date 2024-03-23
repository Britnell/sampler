<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import { type Ui, type BufferState, type SamplesT } from "./hooks";
import Sampleviz from "./samplewave.vue";
import { limit } from "./lib";

const emit = defineEmits(["openModal"]);

const props = defineProps(["buffers", "ui", "samples"]);

type Props = {
  ui: Ui;
  buffers: BufferState;
  samples: SamplesT;
};

const { ui, buffers } = toRefs<Props>(props as Props);

const addEnd = () => {
  if (!ui.value.sample) return;

  ui.value.sample.end = ui.value.sample.begin + 0.5;
  ui.value.edit = "end";
};

const dragSamplePos = (drag: number) => {
  const sample = ui.value.sample;
  const edit = ui.value.edit;
  if (!edit || !sample) return;

  const buffer = buffers.value[sample.bufferid];
  if (!buffer) return;
  const pos = sample[edit] ?? 0;
  const dir = edit === "begin" ? -1 : 1;

  let next = limit(pos + (dir * drag) / 100, 0, buffer.duration);
  if (edit === "begin" && sample?.end && next > sample.end) sample.end = null;
  if (edit === "end" && next < sample.begin) next = sample.begin;
  sample[edit] = next;
};
</script>
<template>
  <section class="view absolute inset-0 bg-[var(--bg)] p-4" v-if="ui.sample">
    <div class="flex justify-between items-start gap-4">
      <h2 class="text-2xl border border-white w-16 h-16">
        {{ ui.sample.key }}
      </h2>
      <div class="">
        <p>{{ ui.sample?.bufferid }}</p>
        <p class="">
          [ {{ ui.sample.begin.toFixed(2) }}s
          <span v-if="ui.sample.end"> - {{ ui.sample.end?.toFixed(2) }}s </span>
          ]
        </p>
      </div>
      <button class="primary" @click="ui.sample = null">Close</button>
    </div>
    <div class="my-6 p-6">
      <h3 class="text-lg font-bold">PLayback</h3>
      <div class="flex justify-between">
        <label>
          <input
            type="checkbox"
            name="hold"
            id="hold"
            v-model="ui.sample.hold"
          />
          hold :
          {{ ui.sample.hold ? " ON " : "OFF" }}
        </label>
        <div class="x">
          <div class="flex gap-6 items-center">
            <p>Mute group: {{ ui.sample.mutegroup ?? "_" }}</p>
            <button
              @click="
                emit('openModal', 'mutegroup', ui.sample.mutegroup ?? 'A')
              "
              class="primary text-sm"
            >
              edit group {{ ui.sample.mutegroup ?? "A" }}
            </button>
          </div>
        </div>
        <p>hit SPACE to stop all samples</p>
      </div>
    </div>
    <div class="relative">
      <Sampleviz
        :buffer="buffers[ui.sample.bufferid]"
        :sample="ui.sample"
        :ui="ui"
        @mouseDrag="dragSamplePos"
      />
      <div>
        <button
          v-if="ui.edit !== 'begin'"
          class="absolute top-0 bottom-0 left-0 right-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
          @click="ui.edit = 'begin'"
        >
          edit begin
        </button>
        <button
          class="absolute top-0 bottom-0 left-0 right-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
          v-else
          @click="ui.edit = null"
        >
          done
        </button>
      </div>
      <div>
        <button
          v-if="ui.edit === 'end'"
          class="absolute top-0 bottom-0 right-0 left-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
          @click="ui.edit = null"
        >
          done
        </button>
        <button
          v-else-if="!ui.edit && !ui.sample.end"
          class="absolute top-0 bottom-0 right-0 left-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
          @click="addEnd"
        >
          add end
        </button>
        <button
          v-else
          class="absolute top-0 bottom-0 right-0 left-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
          @click="ui.edit = 'end'"
        >
          edit end
        </button>
      </div>
    </div>
    <div class="flex justify-between px-6 py-2">
      <button class="primary" @click="emit('openModal', 'splice')">
        splice
      </button>
      <div>
        <p v-if="ui.edit">EDITIING - use arrow keys / drag w mouse</p>
      </div>
      <button
        class="primary"
        :class="ui.sample.end !== null ? '' : ' invisible'"
        @click="ui.sample.end = null"
      >
        Remove end
      </button>
    </div>
    <div class="p-6">
      <p>Move sample:</p>
      <div class="flex gap-4">
        <button class="primary" @click="emit('openModal', 'remove')">
          remove
        </button>
        <button class="primary" @click="emit('openModal', 'move')">move</button>
        <!-- <button class="primary" xclick="emit('openModal', 'move')">swap</button> -->
        <button class="primary" @click="emit('openModal', 'copy')">copy</button>
      </div>
    </div>
  </section>
</template>
