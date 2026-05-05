"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  VideoOff,
  ArrowUp,
} from "lucide-react";
import { aiCoachService } from "@/src/shared/services/ai-coach.service";
import toast from "react-hot-toast";
import Image from "next/image";

interface ImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete?: (analysis: string, imageUrl?: string) => void;
  mode?: "camera" | "upload";
  conversationId?: string;
}

export function ImageAnalysisModal({
  isOpen,
  onClose,
  onAnalysisComplete,
  mode = "upload",
  conversationId,
}: ImageAnalysisModalProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<"camera" | "upload">(mode);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current || isCameraActive) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      const error = err as Error;
      toast.error("Could not access camera. Please check permissions.");
      setError(error.message || "Camera access denied");
      setCurrentMode("upload");
    }
  }, [isCameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        setImageFile(file);
        setCapturedImage(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [stopCamera]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = "";
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image too large. Maximum size is 10MB"); return; }
    setImageFile(file);
    setCapturedImage(URL.createObjectURL(file));
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await aiCoachService.analyzeImage(imageFile);
      let analysisText: string;
      if (typeof result.analysis === "string") {
        analysisText = result.analysis;
      } else if (result.analysis && typeof result.analysis === "object" && "analysis" in result.analysis) {
        analysisText = result.analysis.analysis || result.response || "Analysis completed";
      } else {
        analysisText = result.response || "Analysis completed";
      }
      if (!analysisText || analysisText === "Analysis completed") {
        throw new Error("Analysis completed but no analysis text was returned");
      }
      setAnalysisResult(analysisText);
      if (onAnalysisComplete) onAnalysisComplete(analysisText, result.imageUrl);
    } catch (err: unknown) {
      let errorMessage = "Unable to analyze this image";
      if (err instanceof Error) {
        const errMsg = err.message.toLowerCase();
        if (errMsg.includes("not related to health") || errMsg.includes("not health-related") || errMsg.includes("rejected")) {
          errorMessage = "This image doesn't appear to be health-related. Please upload:\n- Body/physique photos\n- Food/meal photos\n- Fitness progress images\n- Medical documents";
        } else if (errMsg.includes("vision api")) {
          errorMessage = "Image analysis service is temporarily unavailable.";
        } else if (errMsg.includes("size")) {
          errorMessage = "Image file is too large. Maximum size is 10MB.";
        } else {
          errorMessage = err.message || "Unable to analyze this image.";
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, conversationId, onAnalysisComplete]);

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setImageFile(null);
    setAnalysisResult(null);
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    handleReset();
    onClose();
  }, [stopCamera, handleReset, onClose]);

  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      setCurrentMode(mode);
      isInitializedRef.current = true;
      if (mode === "camera") startCamera();
    } else if (!isOpen && isInitializedRef.current) {
      stopCamera();
      handleReset();
      isInitializedRef.current = false;
    }
  }, [isOpen, mode, startCamera, stopCamera, handleReset]);

  useEffect(() => {
    if (!isOpen || !isInitializedRef.current) return;
    if (currentMode === "camera" && !isCameraActive && !streamRef.current && !capturedImage) {
      startCamera();
    } else if (currentMode === "upload" && streamRef.current) {
      stopCamera();
    }
  }, [currentMode, isOpen, isCameraActive, startCamera, stopCamera, capturedImage]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0f1f] border border-white/10 rounded-[24px] p-0 gap-0 shadow-[0_0_80px_rgba(2,132,199,0.08)]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              Image Analysis
            </DialogTitle>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-[10px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-[14px]">
            <button
              onClick={() => { setCurrentMode("upload"); stopCamera(); handleReset(); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all ${
                currentMode === "upload"
                  ? "bg-[#059669] text-white shadow-[0_0_20px_rgba(5,150,105,0.2)]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => { setCurrentMode("camera"); handleReset(); startCamera(); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all ${
                currentMode === "camera"
                  ? "bg-[#059669] text-white shadow-[0_0_20px_rgba(5,150,105,0.2)]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Camera className="w-4 h-4" />
              Camera
            </button>
          </div>

          {/* Camera View */}
          {currentMode === "camera" && (
            <div>
              {!capturedImage ? (
                <div className="relative aspect-[4/3] bg-[#02091b] border border-white/[0.08] rounded-[16px] overflow-hidden">
                  {isCameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 flex items-end justify-center pb-6">
                        <button
                          onClick={capturePhoto}
                          disabled={!isCameraActive}
                          className="w-16 h-16 rounded-full bg-white/90 border-[3px] border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center group"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-slate-300 group-hover:border-cyan-500 transition-colors" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <VideoOff className="w-10 h-10 mx-auto mb-3 text-white/20" />
                        <p className="text-white/30 text-sm mb-4">Camera not active</p>
                        <button
                          onClick={startCamera}
                          className="px-5 py-2 bg-[#059669] text-white text-sm font-medium rounded-[10px] hover:brightness-110 transition-all"
                        >
                          Start Camera
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-[4/3] bg-[#02091b] border border-white/[0.08] rounded-[16px] overflow-hidden group">
                  <Image src={capturedImage} alt="Captured" fill className="object-contain" />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload View */}
          {currentMode === "upload" && (
            <div>
              {!capturedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative aspect-[3/2] border-[1.5px] border-dashed rounded-[16px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-cyan-400/60 bg-cyan-500/[0.06]"
                      : "border-white/[0.12] bg-[#02091b] hover:border-white/25 hover:bg-[#030c22]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                    isDragOver ? "bg-cyan-500/10" : "bg-white/[0.04]"
                  }`}>
                    <Upload className={`w-6 h-6 ${isDragOver ? "text-cyan-400" : "text-white/25"}`} />
                  </div>
                  <p className="text-white/50 text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-white/25 text-xs mt-1.5">
                    JPEG, PNG, WebP, or HEIC (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="relative aspect-[3/2] bg-[#02091b] border border-white/[0.08] rounded-[16px] overflow-hidden group">
                  <Image src={capturedImage} alt="Uploaded" fill className="object-contain" />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 bg-red-500/[0.06] border border-red-500/20 rounded-[12px] flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-400 text-sm font-medium">Analysis Error</p>
                  <p className="text-red-300/70 text-xs mt-1 whitespace-pre-line leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Result */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-[12px] flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-400 text-sm font-medium mb-2">Analysis Complete</p>
                  <p className="text-white/60 text-xs whitespace-pre-wrap leading-relaxed">
                    {analysisResult}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleClose}
              className="flex-1 h-[44px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] hover:text-white/80 transition-all"
            >
              {analysisResult ? "Close" : "Cancel"}
            </button>
            {capturedImage && !analysisResult && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 h-[44px] rounded-[12px] bg-[#0099b9] text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,153,185,0.2)]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    Analyze Image
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
