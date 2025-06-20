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

export const createAiMessageRecord = async (p: {
  pb: PocketBase;
  data: Omit<TAiMessageRecord, "collectionId" | "collectionName" | "id" | "created" | "updated">;
}) => {
  try {
    const resp = await p.pb.collection("aiMessages").create(p.data);
    return aiMessageRecordSchema.safeParse(resp);
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};
