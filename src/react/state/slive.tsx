import {
  configureStore,
  type ThunkAction,
  type Action,
} from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import {
  Provider,
  useDispatch as _useDispatch,
  useSelector as _useSelector,
} from "react-redux";
import { stateSlice } from "./state";

export const store = configureStore({
  reducer: stateSlice.reducer,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useDispatch = _useDispatch.withTypes<AppDispatch>();
export const useSelector = _useSelector.withTypes<RootState>();

export const StoreProvider = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
