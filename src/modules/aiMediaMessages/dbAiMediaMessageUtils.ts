import { z } from "zod";
import PocketBase from "pocketbase";

const aiMediaMessageRecordSchema = z.object({
  collectionId: z.string(),
  collectionName: z.string(),
  id: z.string(),
  threadId: z.string(),
  file: z.string(),
  aiTextMessageId: z.string(),
  created: z.string(),
  updated: z.string(),
});
export type TAiMediaMessageRecord = z.infer<typeof aiMediaMessageRecordSchema>;
export type TAiMediaMessageRecordWithCachedFile = Omit<TAiMediaMessageRecord, "file"> & {
  file: File | undefined;
  fileUrl: string;
};

const collectionName = "aiMediaMessages";

export const createAiMediaMessageRecord = async (p: {
  pb: PocketBase;
  data: Omit<
    TAiMediaMessageRecord,
    "collectionId" | "collectionName" | "id" | "file" | "created" | "updated"
  > & { file: File };
}) => {
  try {
    const resp = await p.pb.collection(collectionName).create(p.data);
    return aiMediaMessageRecordSchema.safeParse(resp);
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};
export const listAiMediaMessageRecords = async (p: { pb: PocketBase }) => {
  try {
    const initData = await p.pb.collection(collectionName).getFullList({
      sort: "-created",
    });

    const data = initData
      .map((x) => aiMediaMessageRecordSchema.safeParse(x))
      .filter((x) => x.success)
      .map((x) => x.data);
    return { success: true, data } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const smartSubscribeToAiMediaMessageRecords = async (p: {
  pb: PocketBase;
  onChange: (x: TAiMediaMessageRecord[]) => void;
  onError: () => void;
}) => {
  const listAiMediaMessageRecordsResp = await listAiMediaMessageRecords(p);
  if (!listAiMediaMessageRecordsResp.success) {
    p.onError();
    return listAiMediaMessageRecordsResp;
  }

  let allRecords = listAiMediaMessageRecordsResp.data;
  p.onChange(allRecords);

  try {
    const unsub = p.pb.collection(collectionName).subscribe("*", (e) => {
      if (e.action === "create") {
        const parseResp = aiMediaMessageRecordSchema.safeParse(e.record);
        if (parseResp.success) allRecords.push(parseResp.data);
      }
      if (e.action === "update") {
        const parseResp = aiMediaMessageRecordSchema.safeParse(e.record);
        if (!parseResp.success) return;

        allRecords = allRecords.filter((x) => parseResp.data?.id !== x.id);
        allRecords.push(parseResp.data);
      }
      if (e.action === "delete") {
        const parseResp = aiMediaMessageRecordSchema.safeParse(e.record);
        if (!parseResp.success) return;

        allRecords = allRecords.filter((x) => parseResp.data?.id !== x.id);
      }
      p.onChange(allRecords);
    });

    return { success: true, data: unsub } as const;
  } catch (error) {
    p.onError();
    return { success: false, error } as const;
  }
};
