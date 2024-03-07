import { ref, watchEffect, type UnwrapRef, type Ref } from "vue";

const readLocal = <T>(key: string, initial: T): T => {
  try {
    const str = localStorage.getItem(key);
    console.log({ str });
    if (!str) return initial;
    return JSON.parse(str);
  } catch (e) {
    return initial;
  }
};

export function cachedRef<T>(key: string, initial: T): Ref<UnwrapRef<T>> {
  const state = ref<T>(initial);
  state.value = readLocal<T>(key, initial) as UnwrapRef<T>;

  watchEffect(() => {
    localStorage.setItem(key, JSON.stringify(state.value));
  });
  return state;
}
