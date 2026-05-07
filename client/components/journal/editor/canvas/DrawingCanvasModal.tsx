"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { CanvasToolbar, type CanvasTool } from "./CanvasToolbar";

interface DrawingCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pngDataUrl: string, fabricJson: string) => void;
  initialFabricJson?: string;
}

export function DrawingCanvasModal({
  isOpen,
  onClose,
  onSave,
  initialFabricJson,
}: DrawingCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fabric.js Canvas type is dynamically imported and not available at ref declaration
  const fabricCanvasRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("pen");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#a78bfa");
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const saveHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Lazy load Fabric.js
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    (async () => {
      const fabricModule = await import("fabric");
      if (!mounted || !canvasRef.current) return;

      const canvas = new fabricModule.Canvas(canvasRef.current, {
        isDrawingMode: true,
        backgroundColor: "#02020a",
        width: window.innerWidth,
        height: window.innerHeight - 120,
      });

      canvas.freeDrawingBrush = new fabricModule.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;

      if (initialFabricJson) {
        await canvas.loadFromJSON(initialFabricJson);
        canvas.renderAll();
      }

      fabricCanvasRef.current = canvas;
      setFabricLoaded(true);

      // Save initial history state
      const json = JSON.stringify(canvas.toJSON());
      historyRef.current = [json];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);

      canvas.on("object:added", saveHistory);
      canvas.on("object:modified", saveHistory);
      canvas.on("object:removed", saveHistory);

      const handleResize = () => {
        canvas.setDimensions({
          width: window.innerWidth,
          height: window.innerHeight - 120,
        });
        canvas.renderAll();
      };
      window.addEventListener("resize", handleResize);
      (canvas as unknown as Record<string, unknown>).__resizeHandler = handleResize;
    })();

    return () => {
      mounted = false;
      const c = fabricCanvasRef.current;
      if (c) {
        const handler = (c as unknown as Record<string, unknown>).__resizeHandler as (() => void) | undefined;
        if (handler) window.removeEventListener("resize", handler);
        c.dispose();
      }
      fabricCanvasRef.current = null;
      setFabricLoaded(false);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update brush settings
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (activeTool === "pen" || activeTool === "eraser") {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = activeTool === "eraser" ? "#02020a" : strokeColor;
        canvas.freeDrawingBrush.width = activeTool === "eraser" ? strokeWidth * 3 : strokeWidth;
      }
    } else {
      canvas.isDrawingMode = false;
    }

    if (activeTool === "select") {
      canvas.selection = true;
    } else {
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [activeTool, strokeWidth, strokeColor]);

  const handleUndo = useCallback(async () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    await canvas.loadFromJSON(historyRef.current[historyIndexRef.current]);
    canvas.renderAll();
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const handleRedo = useCallback(async () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    await canvas.loadFromJSON(historyRef.current[historyIndexRef.current]);
    canvas.renderAll();
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const handleClear = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#02020a";
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const handleSave = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const pngDataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    const fabricJson = JSON.stringify(canvas.toJSON());
    onSave(pngDataUrl, fabricJson);
  }, [onSave]);

  // Handle shape insertion on canvas click
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricLoaded) return;

    const handleMouseDown = async (opt: { e: MouseEvent }) => {
      if (["rect", "circle", "triangle", "line", "arrow", "text"].includes(activeTool)) {
        const fabricModule = await import("fabric");
        const pointer = canvas.getScenePoint(opt.e);
        let obj: InstanceType<typeof fabricModule.FabricObject> | undefined;

        switch (activeTool) {
          case "rect":
            obj = new fabricModule.Rect({
              left: pointer.x, top: pointer.y, width: 120, height: 80,
              fill: "transparent", stroke: strokeColor, strokeWidth,
            });
            break;
          case "circle":
            obj = new fabricModule.Circle({
              left: pointer.x, top: pointer.y, radius: 50,
              fill: "transparent", stroke: strokeColor, strokeWidth,
            });
            break;
          case "triangle":
            obj = new fabricModule.Triangle({
              left: pointer.x, top: pointer.y, width: 100, height: 80,
              fill: "transparent", stroke: strokeColor, strokeWidth,
            });
            break;
          case "line":
            obj = new fabricModule.Line([pointer.x, pointer.y, pointer.x + 150, pointer.y], {
              stroke: strokeColor, strokeWidth,
            });
            break;
          case "arrow":
            obj = new fabricModule.Line([pointer.x, pointer.y, pointer.x + 150, pointer.y], {
              stroke: strokeColor, strokeWidth,
            });
            break;
          case "text":
            obj = new fabricModule.IText("Text", {
              left: pointer.x, top: pointer.y,
              fill: strokeColor, fontSize: 24, fontFamily: "Nunito, sans-serif",
            });
            break;
        }

        if (obj) {
          canvas.add(obj);
          canvas.setActiveObject(obj);
          setActiveTool("select");
        }
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    return () => { canvas.off("mouse:down", handleMouseDown); };
  }, [activeTool, strokeColor, strokeWidth, fabricLoaded]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const canvas = fabricCanvasRef.current;
        const active = canvas?.getActiveObject();
        if (active && !(active as unknown as { isEditing?: boolean }).isEditing) {
          canvas.remove(active);
          canvas.renderAll();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleUndo, handleRedo]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-[#02020a]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0e0a22]">
            <span className="observatory-font-display text-white/40" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
              DRAWING CANVAS
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 transition-all text-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save Drawing
              </button>
              <button onClick={onClose} className="p-2 text-white/20 hover:text-white/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <CanvasToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            strokeColor={strokeColor}
            onStrokeColorChange={setStrokeColor}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            canUndo={canUndo}
            canRedo={canRedo}
          />

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            <canvas ref={canvasRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
