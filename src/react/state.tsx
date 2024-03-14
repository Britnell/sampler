import { Provider, atom, useAtom, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type SampleT = {
  key: string;
  begin: number;
  active: boolean;
  bufferid: string;
};
export type SamplesT = {
  [id: string]: SampleT | null;
};

export const state = atom({
  edit: "",
  loading: false,
});

export const samples = atomWithStorage<SamplesT>("sample-keys", {});

export const useAppState = () => useAtom(state);
export const useSamples = () => useAtom(samples);
