"use client";

import { useState, useCallback, useRef } from "react";
import type {
  FolderSummary,
  IntelligenceFolder,
  IntelligenceMemory,
  IntelligenceArtifact,
  IntelligencePlan,
  CoreProfile,
  LogReference,
} from "@shared/types/domain/intelligence-files";
import type {
  WikiPage,
  WikiPageWithLinks,
  WikiStats,
} from "@shared/types/domain/wiki";
import * as intelligenceApi from "@/src/shared/services/intelligence-files.service";
import * as wikiApi from "@/src/shared/services/wiki.service";
import toast from "react-hot-toast";

type NavigationLevel = "folders" | "list" | "detail";

interface DrawerState {
  isOpen: boolean;
  level: NavigationLevel;
  activeFolder: IntelligenceFolder | null;
  selectedItemId: string | null;
}

export function useIntelligenceFiles() {
  const [drawer, setDrawer] = useState<DrawerState>({
    isOpen: false,
    level: "folders",
    activeFolder: null,
    selectedItemId: null,
  });

  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [memories, setMemories] = useState<IntelligenceMemory[]>([]);
  const [artifacts, setArtifacts] = useState<IntelligenceArtifact[]>([]);
  const [plans, setPlans] = useState<IntelligencePlan[]>([]);
  const [coreProfile, setCoreProfile] = useState<CoreProfile | null>(null);
  const [logs, setLogs] = useState<LogReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wiki state
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [wikiStats, setWikiStats] = useState<WikiStats | null>(null);
  const [selectedWikiPage, setSelectedWikiPage] = useState<WikiPageWithLinks | null>(null);
  const [wikiSearchQuery, setWikiSearchQuery] = useState("");
  const wikiSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drawer controls
  const openDrawer = useCallback(async () => {
    setDrawer({ isOpen: true, level: "folders", activeFolder: null, selectedItemId: null });
    setLoading(true);
    setError(null);
    try {
      const res = await intelligenceApi.getFolders();
      if (res.success && res.data?.folders) {
        setFolders(res.data.folders);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load intelligence files";
      setError(message);
      console.error("[Intelligence] Failed to fetch folders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ isOpen: false, level: "folders", activeFolder: null, selectedItemId: null });
    setSearchQuery("");
  }, []);

  const navigateToFolder = useCallback(async (folder: IntelligenceFolder) => {
    setDrawer((prev) => ({ ...prev, level: "list", activeFolder: folder, selectedItemId: null }));
    setLoading(true);
    setError(null);
    try {
      switch (folder) {
        case "memories": {
          const res = await intelligenceApi.listMemories({ limit: 50 });
          if (res.success && res.data?.memories) setMemories(res.data.memories);
          break;
        }
        case "artifacts": {
          const res = await intelligenceApi.listArtifacts({ limit: 50 });
          if (res.success && res.data?.artifacts) setArtifacts(res.data.artifacts);
          break;
        }
        case "plans": {
          const res = await intelligenceApi.listPlans();
          if (res.success && res.data?.plans) setPlans(res.data.plans);
          break;
        }
        case "core": {
          const res = await intelligenceApi.getCoreProfile();
          if (res.success && res.data?.profile) setCoreProfile(res.data.profile);
          break;
        }
        case "logs": {
          const res = await intelligenceApi.listLogs({ limit: 50 });
          if (res.success && res.data?.logs) setLogs(res.data.logs);
          break;
        }
        case "wiki": {
          const [pagesRes, statsRes] = await Promise.all([
            wikiApi.listPages({ limit: 100, sort: "updated_at", order: "desc" }),
            wikiApi.getStats(),
          ]);
          if (pagesRes.success && pagesRes.data) {
            setWikiPages(pagesRes.data.data ?? []);
          }
          if (statsRes.success && statsRes.data) setWikiStats(statsRes.data);
          break;
        }
        case "notes":
          // Notes use the existing user_files API — loaded via FilesPanel
          break;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to load ${folder}`;
      setError(message);
      console.error(`[Intelligence] Failed to fetch ${folder}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateBack = useCallback(() => {
    setDrawer((prev) => {
      if (prev.level === "detail") {
        return { ...prev, level: "list", selectedItemId: null };
      }
      return { ...prev, level: "folders", activeFolder: null, selectedItemId: null };
    });
  }, []);

  const selectItem = useCallback((id: string) => {
    setDrawer((prev) => ({ ...prev, level: "detail", selectedItemId: id }));
  }, []);

  // Memory actions with optimistic updates
  const handleVerifyMemory = useCallback(async (id: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: "verified" as const, confidence: Math.min(m.confidence + 0.15, 1.0) }
          : m,
      ),
    );
    try {
      const res = await intelligenceApi.verifyMemory(id);
      if (res.success && res.data?.memory) {
        setMemories((prev) => prev.map((m) => (m.id === id ? res.data!.memory : m)));
      }
      toast.success("Memory verified");
    } catch (err) {
      console.error("[Intelligence] Failed to verify memory:", err);
      toast.error("Failed to verify memory");
    }
  }, []);

  const handleRejectMemory = useCallback(async (id: string, reason?: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "rejected" as const } : m)),
    );
    try {
      await intelligenceApi.rejectMemory(id, { reason });
      toast.success("Memory rejected");
    } catch (err) {
      console.error("[Intelligence] Failed to reject memory:", err);
      toast.error("Failed to reject memory");
    }
  }, []);

  const handleExpireMemory = useCallback(async (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "expired" as const } : m)),
    );
    try {
      await intelligenceApi.expireMemory(id);
      toast.success("Memory expired");
    } catch (err) {
      console.error("[Intelligence] Failed to expire memory:", err);
      toast.error("Failed to expire memory");
    }
  }, []);

  // Debounced search
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) return;

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await intelligenceApi.searchMemories(q);
        if (res.success && res.data?.memories) {
          setMemories(res.data.memories);
        }
      } catch (err) {
        console.error("[Intelligence] Search failed:", err);
      }
    }, 300);
  }, []);

  // Wiki actions
  const selectWikiPage = useCallback(async (slug: string) => {
    setDrawer((prev) => ({ ...prev, level: "detail", selectedItemId: slug }));
    setLoading(true);
    setError(null);
    try {
      const res = await wikiApi.getPage(slug);
      if (res.success && res.data) setSelectedWikiPage(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load wiki page";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openWikiPage = useCallback(async (slug: string) => {
    setDrawer({ isOpen: true, level: "detail", activeFolder: "wiki", selectedItemId: slug });
    setLoading(true);
    setError(null);
    try {
      const res = await wikiApi.getPage(slug);
      if (res.success && res.data) setSelectedWikiPage(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load wiki page";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWikiSearch = useCallback((q: string) => {
    setWikiSearchQuery(q);
    if (wikiSearchTimeout.current) clearTimeout(wikiSearchTimeout.current);
    if (!q.trim()) {
      wikiApi.listPages({ limit: 100, sort: "updated_at", order: "desc" }).then((res) => {
        if (res.success && res.data) {
          setWikiPages(res.data.data ?? []);
        }
      });
      return;
    }
    wikiSearchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await wikiApi.searchPages(q);
        if (res.success && res.data) {
          setWikiPages(res.data.map((r) => r.page));
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleFlagWikiPage = useCallback(async (slug: string, reason: string) => {
    try {
      await wikiApi.flagPage(slug, reason);
      toast.success("Page flagged for review");
    } catch (err) {
      console.error("[Wiki] Failed to flag page:", err);
      toast.error("Failed to flag page");
    }
  }, []);

  const handleVerifyWikiPage = useCallback(async (slug: string) => {
    try {
      await wikiApi.submitFeedback(slug, { action: "verify" });
      toast.success("Page verified — confidence boosted");
    } catch (err) {
      console.error("[Wiki] Failed to verify page:", err);
      toast.error("Failed to verify page");
    }
  }, []);

  return {
    // Drawer state
    drawer,
    openDrawer,
    closeDrawer,
    navigateToFolder,
    navigateBack,
    selectItem,

    // Data
    folders,
    memories,
    artifacts,
    plans,
    coreProfile,
    logs,
    loading,
    error,

    // Search
    searchQuery,
    handleSearch,

    // Memory actions
    handleVerifyMemory,
    handleRejectMemory,
    handleExpireMemory,

    // Wiki
    wikiPages,
    wikiStats,
    selectedWikiPage,
    wikiSearchQuery,
    selectWikiPage,
    openWikiPage,
    handleWikiSearch,
    handleFlagWikiPage,
    handleVerifyWikiPage,
  };
}
