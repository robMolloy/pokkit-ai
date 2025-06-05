import { TFileRecord } from "@/modules/files/dbFilesUtils";
import { create } from "zustand";

type TState = TFileRecord[] | undefined;

const useInitFilesStore = create<{
  data: TState;
  setData: (x: TState) => void;
  clear: () => void;
}>()((set) => ({
  data: [],
  setData: (data) => set(() => ({ data })),
  clear: () => set(() => ({ data: undefined })),
}));

export const useFilesStore = () => {
  const initFilesStore = useInitFilesStore();

  return {
    ...initFilesStore,
    data: initFilesStore.data?.sort((a, b) => (a.created > b.created ? -1 : 1)),
  };
};
