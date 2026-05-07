"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { preferencesService } from "@/src/shared/services/preferences.service";
import { uploadService } from "@/src/shared/services/upload.service";
import type { Preferences } from "@/src/types";

export function useAvatarUpload() {
  const [voiceAssistantAvatarUrl, setVoiceAssistantAvatarUrl] = useState<string | null>(null);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarUploadFile, setAvatarUploadFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Load voice assistant avatar from preferences
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const response = await preferencesService.get();
        if (response.success && response.data?.preferences) {
          const prefs = response.data.preferences as Preferences & {
            voiceAssistant?: { avatarUrl?: string | null };
          };
          if (prefs.voiceAssistant?.avatarUrl) {
            setVoiceAssistantAvatarUrl(prefs.voiceAssistant.avatarUrl);
          }
        }
      } catch (error) {
        console.error("[VoiceAssistant] Error loading avatar:", error);
      }
    };
    loadAvatar();
  }, []);

  const handleAvatarFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB");
      return;
    }

    setAvatarUploadFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setShowAvatarUpload(true);
  }, []);

  const handleAvatarUpload = useCallback(async () => {
    if (!avatarUploadFile) return;

    setIsUploadingAvatar(true);
    try {
      const response = await uploadService.uploadVoiceAssistantAvatar(avatarUploadFile);
      if (response.success && response.data?.publicUrl) {
        setVoiceAssistantAvatarUrl(response.data.publicUrl);
        toast.success("Avatar updated successfully");
        setShowAvatarUpload(false);
        setAvatarUploadFile(null);
        setAvatarPreview(null);
        if (avatarFileInputRef.current) {
          avatarFileInputRef.current.value = "";
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("[VoiceAssistant] Error uploading avatar:", error);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [avatarUploadFile]);

  const handleCancelAvatarUpload = useCallback(() => {
    setShowAvatarUpload(false);
    setAvatarUploadFile(null);
    setAvatarPreview(null);
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = "";
    }
  }, []);

  return {
    voiceAssistantAvatarUrl,
    setVoiceAssistantAvatarUrl,
    showAvatarUpload,
    setShowAvatarUpload,
    avatarUploadFile,
    avatarPreview,
    isUploadingAvatar,
    avatarFileInputRef,
    handleAvatarFileSelect,
    handleAvatarUpload,
    handleCancelAvatarUpload,
  };
}
