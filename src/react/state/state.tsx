import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type State = {
  edit: string;
  loading: boolean;
};

export type SampleT = {
  key: string;
  begin: number;
  active: boolean;
  bufferid: string;
};

export type SamplesT = {
  [id: string]: SampleT | null;
};

const initialState = {
  state: {
    edit: "",
    loading: false,
  },
  samples: {
    type: {
      key: "type",
      bufferId: "type",
      begin: 0,
      end: 1,
      active: true,
    },
  },
};

export const stateSlice = createSlice({
  name: "state",
  initialState,
  reducers: {
    editKey: (st, act: PayloadAction<string>) => {
      const sample = st.samples[act.payload] as SampleT;
      if (sample?.active) st.state.edit = act.payload;
    },
    editClose: (st) => {
      st.state.edit = "";
    },
  },
});

export const { editKey, editClose } = stateSlice.actions;

// export const selectCount = (state: RootState) => state.counter.value;
