import PocketBase from "pocketbase";
import { z } from "zod";

const providerRecordSchema = z.object({
  collectionId: z.string(),
  collectionName: z.string(),
  id: z.string(),
  provider: z.string(),
  apiKey: z.string(),
  created: z.string(),
  updated: z.string(),
});

export type TProviderRecord = z.infer<typeof providerRecordSchema>;

export const listProviders = async (p: { pb: PocketBase }) => {
  try {
    const initData = await p.pb.collection("providers").getFullList({
      sort: "-created",
    });

    const data = initData
      .map((x) => providerRecordSchema.safeParse(x))
      .filter((x) => x.success)
      .map((x) => x.data);
    return { success: true, data } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const smartSubscribeToProviders = async (p: {
  pb: PocketBase;
  onChange: (x: TProviderRecord[]) => void;
}) => {
  const listProvidersResp = await listProviders(p);
  if (!listProvidersResp.success) return listProvidersResp;

  let allProviders = listProvidersResp.data;
  p.onChange(allProviders);

  const unsub = p.pb.collection("providers").subscribe("*", (e) => {
    if (e.action === "create") {
      const parseResp = providerRecordSchema.safeParse(e.record);
      if (parseResp.success) allProviders.push(parseResp.data);
    }
    if (e.action === "update") {
      const parseResp = providerRecordSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allProviders = allProviders.filter((x) => parseResp.data?.id !== x.id);
      allProviders.push(parseResp.data);
    }
    if (e.action === "delete") {
      const parseResp = providerRecordSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allProviders = allProviders.filter((x) => parseResp.data?.id !== x.id);
    }
    p.onChange(allProviders);
  });

  return { success: true, data: unsub } as const;
};

export const createProvider = async (p: {
  pb: PocketBase;
  data: Omit<
    TProviderRecord,
    "collectionId" | "collectionName" | "id" | "value" | "created" | "updated"
  >;
}) => {
  try {
    const resp = await p.pb.collection("providers").create(p.data);
    return { success: true, data: resp } as const;
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};

export const updateProvider = async (p: {
  pb: PocketBase;
  data: Omit<TProviderRecord, "collectionId" | "collectionName" | "created" | "updated">;
}) => {
  try {
    const resp = await p.pb.collection("providers").update(p.data.id, p.data);
    return { success: true, data: resp } as const;
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};
