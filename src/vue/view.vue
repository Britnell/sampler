<script setup lang="ts">
import { defineProps, toRefs, defineEmits } from "vue";
import { type Ui, type BufferState, type SamplesT } from "./hooks";
import Sampleviz from "./samplewave.vue";

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

const canvasClick = (pos: number) => {
  if (!ui.value.edit) {
    // if (pos < 0.3) ui.value.edit = "begin";
    // if (pos > 0.7) ui.value.edit = "end";
    return;
  }
  console.log(pos);
};
</script>
<template>
  <section
    class="view absolute inset-0 bg-[var(--bg)] p-4"
    v-if="ui.sample?.active"
  >
    <div class="flex justify-between items-start">
      <h2 class="text-2xl border border-white w-16 h-16">
        {{ ui.sample.key }}
      </h2>
      <p>{{ ui.sample?.bufferid }}</p>
      <button class="primary" @click="ui.sample = null">Close</button>
    </div>
    <div class="my-4 flex justify-between">
      <div></div>
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
        @canvasClick="canvasClick"
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
      <div>
        <button
          class="primary"
          v-if="ui.edit === 'begin'"
          @click="ui.edit = null"
        >
          done
        </button>
        <button class="primary" v-else @click="ui.edit = 'begin'">
          Edit begin
        </button>
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
              class="primary"
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
    <div class="x">
      <p>Move sample:</p>
      <div class="flex gap-4">
        <button class="primary" @click="emit('openModal', 'copy')">copy</button>
        <button class="primary" @click="emit('openModal', 'move')">move</button>
        <button class="primary" @click="emit('openModal', 'remove')">
          remove
        </button>
        <button class="primary" @click="emit('openModal', 'splice')">
          splice
        </button>
      </div>
    </div>
  </section>
</template>
