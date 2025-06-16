import { create } from "zustand";
import { TProviderRecord } from "./dbProvidersUtils";

type TState = TProviderRecord[] | undefined;

const useInitProvidersStore = create<{
  data: TState;
  setData: (x: TState) => void;
  clear: () => void;
}>()((set) => ({
  data: [],
  setData: (data) => set(() => ({ data })),
  clear: () => set(() => ({ data: undefined })),
}));

export const useProvidersStore = () => {
  const store = useInitProvidersStore();

  return {
    ...store,
    anthropic: store.data?.find((x) => x.provider === "anthropic"),
  };
};
