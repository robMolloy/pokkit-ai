import { callAnthropic } from "@/modules/aiChat/anthropicApi";
import { useProvidersStore } from "@/modules/providers/providersStore";
import Anthropic from "@anthropic-ai/sdk";
import { useEffect } from "react";
import { create } from "zustand";

type TInitAnthropicState = Anthropic | null | undefined;
const useInitAnthropicStore = create<{
  data: TInitAnthropicState;
  setData: (data: TInitAnthropicState) => void;
}>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));

export const useAnthropicStore = () => {
  const initAnthropicStore = useInitAnthropicStore();

  return {
    data: initAnthropicStore.data,
    setData: initAnthropicStore.setData,
  };
};

export const useAnthropicStoreSync = () => {
  const settingsStore = useProvidersStore();

  const anthropicSetting = settingsStore.anthropic;
  const initAnthropicStore = useInitAnthropicStore();
  useEffect(() => {
    if (!anthropicSetting?.apiKey) return initAnthropicStore.setData(null);

    initAnthropicStore.setData(undefined);

    const anthropic = new Anthropic({
      apiKey: anthropicSetting.apiKey,
      dangerouslyAllowBrowser: true,
    });

    (async () => {
      const resp = await callAnthropic({
        anthropic,
        messages: [{ role: "user", content: [{ type: "text", text: "Hello, world!" }] }],
        onStreamStatusChange: () => {},
        onStreamChange: () => {},
      });

      initAnthropicStore.setData(resp.success ? anthropic : null);
    })();
  }, [anthropicSetting]);
};
