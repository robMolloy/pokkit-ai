import PocketBase, { RecordModel, RecordSubscription } from "pocketbase";
import { z } from "zod";

const fileRecordSchema = z.object({
  collectionId: z.string(),
  collectionName: z.string(),
  directoryRelationId: z.string().optional(),
  id: z.string(),
  file: z.string(),
  size: z.number(),
  name: z.string(),
  keywords: z.string(),
  isStarred: z.boolean(),
  created: z.string(),
  updated: z.string(),
});
export type TFileRecord = z.infer<typeof fileRecordSchema>;
export type TFileDataRecord = Omit<TFileRecord, "file"> & { file: Blob };
export type TFileDataOrFileRecord = TFileDataRecord | TFileRecord;

export const listFiles = async (p: { pb: PocketBase }) => {
  try {
    const initData = await p.pb.collection("files").getFullList({
      sort: "-created",
    });

    const data = initData
      .map((x) => fileRecordSchema.safeParse(x))
      .filter((x) => x.success)
      .map((x) => x.data);
    return { success: true, data } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const subscribeToFiles = async (p: {
  pb: PocketBase;
  onCreateFile: (e: RecordSubscription<RecordModel>) => void;
  onUpdateFile: (e: RecordSubscription<RecordModel>) => void;
}) => {
  p.pb.collection("files").subscribe("*", (e) => {
    if (e.action) p.onCreateFile(e);
  });
  return { success: true } as const;
};

export const smartSubscribeToFiles = async (p: {
  pb: PocketBase;
  onChange: (x: TFileRecord[]) => void;
}) => {
  const listFilesResp = await listFiles(p);
  if (!listFilesResp.success) return listFilesResp;

  let allFiles = listFilesResp.data;
  p.onChange(allFiles);
  const unsub = p.pb.collection("files").subscribe("*", (e) => {
    if (e.action === "create") {
      const parseResp = fileRecordSchema.safeParse(e.record);
      if (parseResp.success) allFiles.push(parseResp.data);
    }
    if (e.action === "update") {
      const parseResp = fileRecordSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allFiles = allFiles.filter((x) => parseResp.data?.id !== x.id);
      allFiles.push(parseResp.data);
    }
    if (e.action === "delete") {
      const parseResp = fileRecordSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allFiles = allFiles.filter((x) => parseResp.data?.id !== x.id);
    }
    p.onChange(allFiles);
  });

  return { success: true, data: unsub } as const;
};

export const createFile = async (p: {
  pb: PocketBase;
  data: Omit<
    TFileDataRecord,
    "collectionId" | "collectionName" | "id" | "size" | "created" | "updated"
  >;
}) => {
  try {
    const resp = await p.pb.collection("files").create(p.data);
    return fileRecordSchema.safeParse(resp);
  } catch (error) {
    return { success: false, error } as const;
  }
};

type TUpdatify<T extends { id: string }> = Pick<T, "id"> & Partial<Omit<T, "id">>;

export const updateFile = async (p: { pb: PocketBase; data: TUpdatify<TFileDataOrFileRecord> }) => {
  try {
    const resp = await p.pb.collection("files").update(p.data.id, p.data);
    return fileRecordSchema.safeParse(resp);
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const getFileRecord = async (p: { pb: PocketBase; id: string }) => {
  try {
    const resp = await p.pb.collection("files").getOne(p.id);

    return fileRecordSchema.safeParse(resp);
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const getFileDataRecordFromFileRecord = async (p: {
  pb: PocketBase;
  data: TFileRecord;
  isThumb: boolean;
}) => {
  try {
    const fileUrl = p.pb.files.getURL(
      p.data,
      p.data.file,
      p.isThumb ? { thumb: "100x100" } : undefined,
    );
    if (!fileUrl) return { success: false, error: "File not found" } as const;

    const fileResp = await fetch(fileUrl);
    const file = await fileResp.blob();

    if (!file) return { success: false, error: "File not found" } as const;

    return { success: true, data: { ...p.data, file } } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};
export const getFile = async (p: { pb: PocketBase; id: string; isThumb: boolean }) => {
  try {
    const fileRecord = await getFileRecord(p);

    if (!fileRecord.success) return fileRecord;

    return getFileDataRecordFromFileRecord({
      pb: p.pb,
      data: fileRecord.data,
      isThumb: p.isThumb,
    });
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const deleteFile = async (p: { pb: PocketBase; id: string }) => {
  try {
    await p.pb.collection("files").delete(p.id);
    return { success: true } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const downloadFile = async (p: { data: TFileDataRecord }) => {
  const downloadUrl = window.URL.createObjectURL(p.data.file);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = p.data.name;
  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(downloadUrl);
  a.remove();
};
