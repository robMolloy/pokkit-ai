import { z } from "zod";
import PocketBase from "pocketbase";

const aiMessageRecordSchema = z.object({
  collectionId: z.string(),
  collectionName: z.string(),
  id: z.string(),
  threadId: z.string(),
  role: z.enum(["user", "assistant"]),
  contentType: z.enum(["text", "image", "document"]),
  contentText: z.string(),
  contentSourceType: z.string(),
  contentSourceData: z.string(),
  contentSourceMediaType: z.string(),
  created: z.string(),
  updated: z.string(),
});
export type TAiMessageRecord = z.infer<typeof aiMessageRecordSchema>;

const collectionName = "aiMessages";

export const createAiMessageRecord = async (p: {
  pb: PocketBase;
  data: Omit<TAiMessageRecord, "collectionId" | "collectionName" | "id" | "created" | "updated">;
}) => {
  try {
    const resp = await p.pb.collection(collectionName).create(p.data);
    return aiMessageRecordSchema.safeParse(resp);
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};
export const listAiMessageRecords = async (p: { pb: PocketBase }) => {
  try {
    const initData = await p.pb.collection(collectionName).getFullList({
      sort: "-created",
    });

    const data = initData
      .map((x) => aiMessageRecordSchema.safeParse(x))
      .filter((x) => x.success)
      .map((x) => x.data);
    return { success: true, data } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const smartSubscribeToAiMessageRecords = async (p: {
  pb: PocketBase;
  onChange: (x: TAiMessageRecord[]) => void;
  onError: () => void;
}) => {
  const listAiMessageRecordsResp = await listAiMessageRecords(p);
  if (!listAiMessageRecordsResp.success) {
    p.onError();
    return listAiMessageRecordsResp;
  }

  let allRecords = listAiMessageRecordsResp.data;
  p.onChange(allRecords);

  try {
    const unsub = p.pb.collection(collectionName).subscribe("*", (e) => {
      if (e.action === "create") {
        const parseResp = aiMessageRecordSchema.safeParse(e.record);
        if (parseResp.success) allRecords.push(parseResp.data);
      }
      if (e.action === "update") {
        const parseResp = aiMessageRecordSchema.safeParse(e.record);
        if (!parseResp.success) return;

        allRecords = allRecords.filter((x) => parseResp.data?.id !== x.id);
        allRecords.push(parseResp.data);
      }
      if (e.action === "delete") {
        const parseResp = aiMessageRecordSchema.safeParse(e.record);
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
