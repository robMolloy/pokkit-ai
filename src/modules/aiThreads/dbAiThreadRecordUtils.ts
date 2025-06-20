import { z } from "zod";
import PocketBase from "pocketbase";

const aiThreadRecordSchema = z.object({
  collectionId: z.string(),
  collectionName: z.string(),
  id: z.string(),
  title: z.string(),
  threadId: z.string(),
  created: z.string(),
  updated: z.string(),
});
export type TAiThreadRecord = z.infer<typeof aiThreadRecordSchema>;

export const createAiThreadRecord = async (p: {
  pb: PocketBase;
  data: Omit<TAiThreadRecord, "collectionId" | "collectionName" | "id" | "created" | "updated">;
}) => {
  try {
    const resp = await p.pb.collection("aiThreads").create(p.data);
    return { success: true, data: resp } as const;
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};
