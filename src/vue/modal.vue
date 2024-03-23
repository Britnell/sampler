<script setup>
import { ref, watch, defineProps, defineEmits, toRefs } from "vue";

const props = defineProps(["isOpen"]);

const el = ref(null);
const { isOpen } = toRefs(props);
const emit = defineEmits(["close"]);

watch(isOpen, () => {
  if (isOpen.value) el.value.showModal();
  else el.value.close();
});

const onClose = () => {
  emit("close");
};
</script>

<style scoped>
dialog::backdrop {
  background: rgba(0, 0, 0, 0.2);
}
</style>
<template>
  <dialog ref="el" @close="onClose">
    <slot></slot>
  </dialog>
</template>
