"use client";

import { useState, useCallback } from "react";
import type { TransparencyData } from "@shared/types/domain/intelligence-files";
import { api } from "@/lib/api-client";

export function useTransparencyPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [data, setData] = useState<TransparencyData | null>(null);
  const [loading, setLoading] = useState(false);

  const showForMessage = useCallback(async (messageId: string) => {
    if (activeMessageId === messageId && isOpen) {
      setIsOpen(false);
      setActiveMessageId(null);
      return;
    }

    setActiveMessageId(messageId);
    setIsOpen(true);
    setLoading(true);

    try {
      const res = await api.get<{ transparency: TransparencyData }>(
        `/v1/intelligence/files/transparency/${messageId}`,
      );
      if (res.success && res.data?.transparency) {
        setData(res.data.transparency);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeMessageId, isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveMessageId(null);
    setData(null);
  }, []);

  const submitHelpfulness = useCallback(
    async (messageId: string, wasHelpful: boolean, correction?: string) => {
      try {
        await api.post(`/v1/intelligence/files/transparency/${messageId}/feedback`, {
          wasHelpful,
          correction,
        });
      } catch {
        // Silent fail for feedback
      }
    },
    [],
  );

  return {
    isOpen,
    activeMessageId,
    data,
    loading,
    showForMessage,
    close,
    submitHelpfulness,
  };
}
