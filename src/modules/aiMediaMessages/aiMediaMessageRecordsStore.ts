import { create } from "zustand";
import { TAiMediaMessageRecord } from "./dbAiMediaMessageUtils";
import { useEffect } from "react";
import { createFileFromMediaUrl } from "../aiChat/utils";

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

const createUrlFromMediaMessageRecord = ({ id, file }: TAiMediaMessageRecord) =>
  `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/aiMediaMessages/${id}/${file}`;

type TCachedFilesState = { [url: string]: File };
export const useCachedFilesStore = create<{
  data: TCachedFilesState;
  setData: (x: TCachedFilesState) => void;
  addData: (x: TCachedFilesState) => void;
  clear: () => void;
}>()((set) => ({
  data: {},
  setData: (data) => set(() => ({ data })),
  addData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
  clear: () => set(() => ({ data: {} })),
}));

export const useCachedFilesStoreWatcher = () => {
  const aiMediaMessageRecordsStore = useInitAiMediaMessageRecordsStore();
  const cachedFilesStore = useCachedFilesStore();

  useEffect(() => {
    aiMediaMessageRecordsStore.data?.forEach((x) => {
      if (x.file in cachedFilesStore.data) return;

      const filePromise = createFileFromMediaUrl({ url: createUrlFromMediaMessageRecord(x) });
      filePromise.then((x) => {
        if (x.success) cachedFilesStore.addData({ [x.data.name]: x.data });
      });
    });
  }, [aiMediaMessageRecordsStore.data]);
};

export const useAiMediaMessageRecordsWithCachedFilesStore = () => {
  const aiMediaMessageRecordsStore = useAiMediaMessageRecordsStore();
  const cachedFilesStore = useCachedFilesStore();

  const data = aiMediaMessageRecordsStore.data?.map((x) => {
    const file = cachedFilesStore.data[x.file];
    return { ...x, file, fileUrl: x.file };
  });

  const getMessagesByThreadId = (threadId: string) => data?.filter((x) => x.threadId === threadId);

  return { data, getMessagesByThreadId };
};
