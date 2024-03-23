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
    <div class="flex justify-between items-start">
      <h2 class="text-2xl border border-white w-16 h-16">
        {{ ui.sample.key }}
      </h2>
      <p>{{ ui.sample?.bufferid }}</p>
      <button class="primary" @click="ui.sample = null">Close</button>
    </div>
    <div class="my-4 flex justify-between">
      <div>
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
      </div>
      <p>
        [ {{ ui.sample.begin.toFixed(2) }}
        <span v-if="ui.sample.end"> - {{ ui.sample.end?.toFixed(2) }} </span>
        ]
      </p>
      <span></span>
    </div>
    <div class="relative">
      <Sampleviz
        :buffer="buffers[ui.sample.bufferid]"
        :sample="ui.sample"
        :ui="ui"
        @mouseDrag="dragSamplePos"
      />
      <button
        v-if="!ui.edit"
        class="absolute top-0 bottom-0 left-0 right-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
        @click="ui.edit = 'begin'"
      >
        edit begin
      </button>
      <button
        v-if="!ui.edit && !ui.sample.end"
        class="absolute top-0 bottom-0 right-0 left-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
        @click="addEnd"
      >
        add end
      </button>
      <button
        v-if="!ui.edit && ui.sample.end"
        class="absolute top-0 bottom-0 right-0 left-[75%] bg-white bg-opacity-10 opacity-0 hover:opacity-100"
        @click="ui.edit = 'end'"
      >
        edit end
      </button>
    </div>
    <div class="flex justify-between">
      <div class="flex flex-col gap-2">
        <button
          class="primary bg-white text-black"
          v-if="ui.edit === 'begin'"
          @click="ui.edit = null"
        >
          done
        </button>
        <button class="primary" v-else @click="ui.edit = 'begin'">
          Edit begin
        </button>
        <button class="primary" @click="emit('openModal', 'splice')">
          splice
        </button>
      </div>
      <div>
        <p v-if="ui.edit">use arrow keys / drag w mouse</p>
      </div>
      <div>
        <div class="flex flex-col gap-2">
          <div>
            <button
              class="primary"
              v-if="ui.sample.end === null"
              @click="addEnd"
            >
              add end
            </button>
            <button
              class="primary bg-white text-black"
              v-else-if="ui.edit === 'end'"
              @click="ui.edit = null"
            >
              done
            </button>
            <button v-else class="primary" @click="ui.edit = 'end'">
              Edit End
            </button>
          </div>
          <div>
            <button
              class="primary"
              :class="ui.sample.end !== null ? '' : ' invisible'"
              @click="ui.sample.end = null"
            >
              Remove end
            </button>
          </div>
        </div>
      </div>
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
