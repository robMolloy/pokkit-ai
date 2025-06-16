import { create } from "zustand";
import { TSettingsRecord } from "./dbSettingsUtils";

type TState = TSettingsRecord[] | undefined;

const useInitSettingsStore = create<{
  data: TState;
  setData: (x: TState) => void;
  clear: () => void;
}>()((set) => ({
  data: [],
  setData: (data) => set(() => ({ data })),
  clear: () => set(() => ({ data: undefined })),
}));

export const useSettingsStore = () => {
  const store = useInitSettingsStore();

  return {
    ...store,
    anthropicSetting: { get: () => store.data?.find((x) => x.provider === "anthropic") },
  };
};
