import PocketBase from "pocketbase";
import { z } from "zod";

const directorySchema = z.object({
  collectionId: z.string(),
  collectionName: z.string(),
  id: z.string(),
  name: z.string(),
  directoryRelationId: z.string(),
  created: z.string(),
  updated: z.string(),
  isStarred: z.boolean(),
});
export type TDirectory = z.infer<typeof directorySchema>;

export const listDirectories = async (p: { pb: PocketBase }) => {
  try {
    const initData = await p.pb.collection("directories").getFullList({
      sort: "-created",
    });

    const data = initData
      .map((x) => directorySchema.safeParse(x))
      .filter((x) => x.success)
      .map((x) => x.data);
    return { success: true, data } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const smartSubscribeToDirectories = async (p: {
  pb: PocketBase;
  onChange: (x: TDirectory[]) => void;
}) => {
  const listDirectoriesResp = await listDirectories(p);
  if (!listDirectoriesResp.success) return listDirectoriesResp;

  let allDirectories = listDirectoriesResp.data;
  p.onChange(allDirectories);
  const unsub = p.pb.collection("directories").subscribe("*", (e) => {
    if (e.action === "create") {
      const parseResp = directorySchema.safeParse(e.record);
      if (parseResp.success) allDirectories.push(parseResp.data);
    }
    if (e.action === "update") {
      const parseResp = directorySchema.safeParse(e.record);
      if (!parseResp.success) return;

      allDirectories = allDirectories.filter((x) => parseResp.data?.id !== x.id);
      allDirectories.push(parseResp.data);
    }
    if (e.action === "delete") {
      const parseResp = directorySchema.safeParse(e.record);
      if (!parseResp.success) return;

      allDirectories = allDirectories.filter((x) => parseResp.data?.id !== x.id);
    }
    p.onChange(allDirectories);
  });

  return { success: true, data: unsub } as const;
};

export const createDirectory = async (p: {
  pb: PocketBase;
  data: Omit<TDirectory, "collectionId" | "collectionName" | "id" | "created" | "updated">;
}) => {
  try {
    const resp = await p.pb.collection("directories").create(p.data);
    return { success: true, data: resp } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const updateDirectory = async (p: { pb: PocketBase; data: TDirectory }) => {
  try {
    const resp = await p.pb.collection("directories").update(p.data.id, p.data);
    return { success: true, data: resp } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const getDirectory = async (p: { pb: PocketBase; id: string }) => {
  try {
    const resp = await p.pb.collection("directories").getOne(p.id);
    return directorySchema.safeParse(resp);
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const deleteDirectory = async (p: { pb: PocketBase; id: string }) => {
  try {
    await p.pb.collection("directories").delete(p.id);
    return { success: true } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};
