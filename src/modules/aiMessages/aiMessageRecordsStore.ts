import { create } from "zustand";
import { TAiMessageRecord } from "./dbAiMessageUtils";

type TState = TAiMessageRecord[] | undefined | null;

const useInitAiMessageRecordsStore = create<{
  data: TState;
  setData: (x: TState) => void;
  clear: () => void;
}>()((set) => ({
  data: undefined,
  setData: (data) => set(() => ({ data })),
  clear: () => set(() => ({ data: undefined })),
}));

export const useAiMessageRecordsStore = () => {
  const store = useInitAiMessageRecordsStore();

  return {
    ...store,
    getMessagesByThreadId: (threadId: string) => store.data?.filter((x) => x.threadId === threadId),
  };
};
