import PocketBase from "pocketbase";
import { z } from "zod";

const settingsRecordSchema = z.object({
  collectionId: z.string(),
  collectionName: z.string(),
  id: z.string(),
  settingName: z.string(),
  isEnabled: z.boolean(),
  value: z.string(),
  created: z.string(),
  updated: z.string(),
});

export type TSettingsRecord = z.infer<typeof settingsRecordSchema>;

export const listSettings = async (p: { pb: PocketBase }) => {
  try {
    const initData = await p.pb.collection("settings").getFullList({
      sort: "-created",
    });

    const data = initData
      .map((x) => settingsRecordSchema.safeParse(x))
      .filter((x) => x.success)
      .map((x) => x.data);
    return { success: true, data } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const smartSubscribeToSettings = async (p: {
  pb: PocketBase;
  onChange: (x: TSettingsRecord[]) => void;
}) => {
  const listSettingsResp = await listSettings(p);
  if (!listSettingsResp.success) return listSettingsResp;

  let allSettings = listSettingsResp.data;
  p.onChange(allSettings);

  const unsub = p.pb.collection("settings").subscribe("*", (e) => {
    if (e.action === "create") {
      const parseResp = settingsRecordSchema.safeParse(e.record);
      if (parseResp.success) allSettings.push(parseResp.data);
    }
    if (e.action === "update") {
      const parseResp = settingsRecordSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allSettings = allSettings.filter((x) => parseResp.data?.id !== x.id);
      allSettings.push(parseResp.data);
    }
    if (e.action === "delete") {
      const parseResp = settingsRecordSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allSettings = allSettings.filter((x) => parseResp.data?.id !== x.id);
    }
    p.onChange(allSettings);
  });

  return { success: true, data: unsub } as const;
};

export const createSetting = async (p: {
  pb: PocketBase;
  data: Omit<
    TSettingsRecord,
    "collectionId" | "collectionName" | "id" | "value" | "created" | "updated"
  >;
}) => {
  try {
    const resp = await p.pb.collection("settings").create(p.data);
    return { success: true, data: resp } as const;
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};

export const updateSetting = async (p: {
  pb: PocketBase;
  data: Omit<TSettingsRecord, "collectionId" | "collectionName" | "created" | "updated">;
}) => {
  try {
    const resp = await p.pb.collection("settings").update(p.data.id, p.data);
    return { success: true, data: resp } as const;
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};
