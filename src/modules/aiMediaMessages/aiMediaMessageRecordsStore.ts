import { create } from "zustand";
import { TAiMediaMessageRecord } from "./dbAiMediaMessageUtils";

type TState = TAiMediaMessageRecord[] | undefined | null;

const useInitAiMediaMessageRecordsStore = create<{
  data: TState;
  setData: (x: TState) => void;
  clear: () => void;
}>()((set) => ({
  data: undefined,
  setData: (data) => set(() => ({ data })),
  clear: () => set(() => ({ data: undefined })),
}));

export const useAiMediaMessageRecordsStore = () => {
  const store = useInitAiMediaMessageRecordsStore();

  return {
    ...store,
    getMessagesByThreadId: (threadId: string) => store.data?.filter((x) => x.threadId === threadId),
  };
};
