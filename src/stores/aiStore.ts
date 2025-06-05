import { callClaude } from "@/modules/aiChat/anthropicApi";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import Anthropic from "@anthropic-ai/sdk";
import { useEffect } from "react";
import { create } from "zustand";

type TInitAiState = Anthropic | null | undefined;
const useInitAiStore = create<{
  data: TInitAiState;
  setData: (data: TInitAiState) => void;
}>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));

export const useAiStoreSync = () => {
  const settingsStore = useSettingsStore();

  const aiChatSetting = settingsStore.aiChatSetting.get();
  const initAiStore = useInitAiStore();
  useEffect(() => {
    if (!aiChatSetting?.isEnabled || !aiChatSetting?.value) return initAiStore.setData(null);

    initAiStore.setData(undefined);

    const anthropic = new Anthropic({ apiKey: aiChatSetting.value, dangerouslyAllowBrowser: true });

    (async () => {
      const resp = await callClaude({
        anthropic,
        messages: [{ role: "user", content: [{ type: "text", text: "Hello, world!" }] }],
        onFirstStream: () => {},
        onStream: () => {},
      });

      initAiStore.setData(resp.success ? anthropic : null);
    })();
  }, [aiChatSetting]);
};

export const useAiStore = () => {
  const initAiStore = useInitAiStore();

  return {
    data: initAiStore.data,
    setData: initAiStore.setData,
  };
};
