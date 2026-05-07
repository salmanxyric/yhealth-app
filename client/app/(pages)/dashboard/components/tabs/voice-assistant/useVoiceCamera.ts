"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  subscribeToVisionEvents,
  emitVisionFrame,
  startVisionSession,
  stopVisionSession,
  type VisionStateEvent,
  type VisionCoachingEvent,
} from "@/lib/socket-client";

interface UseVoiceCameraOptions {
  isTTSEnabledRef: React.MutableRefObject<boolean>;
  speakResponseRef: React.MutableRefObject<((text: string) => void) | null>;
  speakWithBrowserTTS: (text: string) => void;
}

export function useVoiceCamera(options: UseVoiceCameraOptions) {
  const { isTTSEnabledRef, speakResponseRef, speakWithBrowserTTS } = options;

  // Camera state
  const [showInlineCamera, setShowInlineCamera] = useState(false);
  const [inlineCameraMode, setInlineCameraMode] = useState<"camera" | "upload">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [_cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [_countdown, setCountdown] = useState<number | null>(null);
  const [shouldAutoCapture, setShouldAutoCapture] = useState(false);
  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);
  const [imageDescription, setImageDescription] = useState<string>("");

  // Vision coaching state
  const [isVisionActive, setIsVisionActive] = useState(false);
  const [visionState, setVisionState] = useState<VisionStateEvent | null>(null);
  const [visionCoaching, setVisionCoaching] = useState<VisionCoachingEvent | null>(null);

  // Camera refs
  const inlineVideoRef = useRef<HTMLVideoElement>(null);
  const inlineCanvasRef = useRef<HTMLCanvasElement>(null);
  const inlineStreamRef = useRef<MediaStream | null>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const visionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visionFrameIntervalMs = useRef(3000);
  const visionCleanupRef = useRef<(() => void) | null>(null);

  // ============================================
  // INLINE CAMERA
  // ============================================

  const startInlineCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Camera not supported in this browser";
      console.error("[VoiceAssistant]", errorMsg);
      setCameraError(errorMsg);
      setIsCameraActive(false);
      toast.error(errorMsg);
      return;
    }

    if (inlineStreamRef.current) {
      inlineStreamRef.current.getTracks().forEach((track) => track.stop());
      inlineStreamRef.current = null;
    }

    setIsCameraActive(false);
    setCameraError(null);

    try {
      let mediaStream: MediaStream | null = null;
      let cameraError: Error | null = null;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (envError) {
        console.log("[VoiceAssistant] Back camera failed, trying front camera:", envError);
        cameraError = envError as Error;

        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false,
            });
          } catch (fallbackError) {
            throw fallbackError;
          }
        }
      }

      if (!mediaStream) {
        throw cameraError || new Error("Failed to access camera");
      }

      inlineStreamRef.current = mediaStream;

      if (inlineVideoRef.current) {
        const video = inlineVideoRef.current;

        if (video.srcObject) {
          const oldStream = video.srcObject as MediaStream;
          oldStream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }

        video.srcObject = mediaStream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");

        await new Promise<void>((resolve, reject) => {
          if (!inlineVideoRef.current) {
            reject(new Error("Video element not available"));
            return;
          }

          let resolved = false;

          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("play", onPlay);
            video.removeEventListener("error", onError);
          };

          const onLoadedMetadata = () => {
            console.log("[VoiceAssistant] Camera video metadata loaded");
            video.play().catch((playError) => {
              console.warn("[VoiceAssistant] Auto-play prevented:", playError);
            });
          };

          const onCanPlay = () => {
            console.log("[VoiceAssistant] Camera video can play");
            if (video.paused) {
              video.play().catch((playError) => {
                console.warn("[VoiceAssistant] Play failed:", playError);
              });
            }
          };

          const onPlay = () => {
            console.log("[VoiceAssistant] Camera video started playing");
            if (!resolved) {
              resolved = true;
              cleanup();
              resolve();
            }
          };

          const onPlaying = () => {
            console.log("[VoiceAssistant] Camera video is playing");
            if (!resolved) {
              resolved = true;
              cleanup();
              resolve();
            }
          };

          const onError = (e: Event) => {
            console.error("[VoiceAssistant] Video element error:", e);
            if (!resolved) {
              resolved = true;
              cleanup();
              reject(new Error("Video element failed to load"));
            }
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("canplay", onCanPlay);
          video.addEventListener("play", onPlay);
          video.addEventListener("playing", onPlaying);
          video.addEventListener("error", onError);

          const attemptPlay = async () => {
            try {
              await video.play();
              console.log("[VoiceAssistant] Video play() succeeded");
            } catch (playError: unknown) {
              console.warn("[VoiceAssistant] Play attempt failed, will retry:", playError);
              setTimeout(() => {
                if (!resolved && video.srcObject) {
                  video.play().catch((err) => {
                    console.warn("[VoiceAssistant] Retry play failed:", err);
                  });
                }
              }, 100);
            }
          };

          attemptPlay();

          // Timeout after 5 seconds
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              cleanup();
              if (video.srcObject && video.readyState >= 2) {
                if (video.paused) {
                  video.play().catch(() => {});
                }
                console.log("[VoiceAssistant] Camera video ready (timeout check passed)");
                resolve();
              } else {
                reject(new Error("Camera initialization timeout - video not playing"));
              }
            }
          }, 5000);
        });

        setIsCameraActive(true);
        console.log("[VoiceAssistant] Camera started successfully");
      } else {
        inlineStreamRef.current = mediaStream;
        setIsCameraActive(true);
        console.log("[VoiceAssistant] Camera stream obtained, waiting for video element");
      }
    } catch (err) {
      const error = err as Error;
      console.error("[VoiceAssistant] Inline camera error:", error);

      if (inlineStreamRef.current) {
        inlineStreamRef.current.getTracks().forEach((track) => track.stop());
        inlineStreamRef.current = null;
      }

      let errorMsg = "Camera access denied";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMsg = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMsg = "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMsg = "Camera is being used by another application. Please close other apps and try again.";
      } else if (error.message) {
        errorMsg = error.message;
      }

      setCameraError(errorMsg);
      setIsCameraActive(false);
      toast.error(`Camera error: ${errorMsg}`);
    }
  }, []);

  const stopInlineCamera = useCallback(() => {
    if (inlineStreamRef.current) {
      inlineStreamRef.current.getTracks().forEach((track) => track.stop());
      inlineStreamRef.current = null;
      setIsCameraActive(false);
      if (inlineVideoRef.current) {
        inlineVideoRef.current.srcObject = null;
      }
    }
  }, []);

  const captureInlinePhoto = useCallback(() => {
    if (!inlineVideoRef.current || !inlineCanvasRef.current) return;

    const video = inlineVideoRef.current;
    const canvas = inlineCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setImageFile(file);
        setCapturedImage(url);
      },
      "image/jpeg",
      0.95,
    );
  }, []);

  const handleInlineFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image too large. Maximum size is 10MB");
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      setCameraError(null);
    }
    if (e.target) e.target.value = "";
  }, []);

  const analyzeInlineImage = useCallback(async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setCameraError(null);
    setAnalysisResult(null);

    try {
      const { aiCoachService } = await import("@/src/shared/services/ai-coach.service");
      console.log("[VoiceAssistant] Starting image analysis...", {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        description: imageDescription,
      });

      const result = await aiCoachService.analyzeImage(imageFile, undefined, imageDescription.trim() || undefined);

      console.log("[VoiceAssistant] Image analysis result:", result);

      let analysis: string;
      if (typeof result.analysis === "string") {
        analysis = result.analysis;
      } else if (result.analysis && typeof result.analysis === "object" && "analysis" in result.analysis) {
        analysis = result.analysis.analysis || result.response || "Analysis completed";
      } else {
        analysis = result.response || "Analysis completed";
      }

      if (!analysis || analysis === "Analysis completed") {
        console.warn("[VoiceAssistant] No analysis text found in result:", result);
        throw new Error("Analysis completed but no analysis text was returned");
      }

      console.log("[VoiceAssistant] Extracted analysis text:", analysis.substring(0, 100) + "...");
      setAnalysisResult(analysis);

      if (isTTSEnabledRef.current) {
        await speakWithBrowserTTS(analysis);
      }

      setTimeout(() => {
        setShowInlineCamera(false);
        setCapturedImage(null);
        setImageFile(null);
        setAnalysisResult(null);
        setImageDescription("");
      }, 3000);
    } catch (err: unknown) {
      console.error("[VoiceAssistant] Image analysis error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image";
      setCameraError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, imageDescription, speakWithBrowserTTS, isTTSEnabledRef]);

  // ============================================
  // VISION COACHING
  // ============================================

  const captureAndSendFrame = useCallback(() => {
    const video = inlineVideoRef.current;
    const canvas = inlineCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 640, 480);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    const base64 = dataUrl.split(",")[1];
    if (base64) {
      emitVisionFrame(base64);
    }
  }, []);

  const _startVisionCoaching = useCallback(() => {
    if (isVisionActive || !isCameraActive) return;

    console.log("[VoiceAssistant] Starting vision coaching");
    setIsVisionActive(true);

    startVisionSession();

    const cleanup = subscribeToVisionEvents({
      onState: (data) => {
        setVisionState(data);
      },
      onCoaching: (data) => {
        setVisionCoaching(data);
        setTimeout(() => setVisionCoaching(null), 5000);
        if (isTTSEnabledRef.current && speakResponseRef.current && data.severity === "warning") {
          speakResponseRef.current(data.message);
        }
      },
      onThrottle: (data) => {
        console.log("[VoiceAssistant] Vision throttled, new interval:", data.intervalMs);
        visionFrameIntervalMs.current = data.intervalMs;
        if (visionIntervalRef.current) {
          clearInterval(visionIntervalRef.current);
          visionIntervalRef.current = setInterval(captureAndSendFrame, data.intervalMs);
        }
      },
      onError: (data) => {
        console.error("[VoiceAssistant] Vision error:", data.message);
        toast.error(`Vision: ${data.message}`);
      },
      onFood: (data) => {
        toast.success(`Food detected: ${data.item}`, { duration: 4000 });
      },
    });
    visionCleanupRef.current = cleanup;

    visionIntervalRef.current = setInterval(captureAndSendFrame, visionFrameIntervalMs.current);
  }, [isVisionActive, isCameraActive, captureAndSendFrame, isTTSEnabledRef, speakResponseRef]);

  const stopVisionCoaching = useCallback(() => {
    if (!isVisionActive) return;

    console.log("[VoiceAssistant] Stopping vision coaching");
    setIsVisionActive(false);
    setVisionState(null);
    setVisionCoaching(null);
    visionFrameIntervalMs.current = 3000;

    if (visionIntervalRef.current) {
      clearInterval(visionIntervalRef.current);
      visionIntervalRef.current = null;
    }

    if (visionCleanupRef.current) {
      visionCleanupRef.current();
      visionCleanupRef.current = null;
    }

    stopVisionSession();
  }, [isVisionActive]);

  // Stop vision when camera deactivated
  useEffect(() => {
    if (!isCameraActive && isVisionActive) {
      stopVisionCoaching();
    }
  }, [isCameraActive, isVisionActive, stopVisionCoaching]);

  // Cleanup vision on unmount
  useEffect(() => {
    return () => {
      if (visionIntervalRef.current) {
        clearInterval(visionIntervalRef.current);
      }
      if (visionCleanupRef.current) {
        visionCleanupRef.current();
      }
    };
  }, []);

  // Auto-start camera when modal opens in camera mode
  useEffect(() => {
    if (showInlineCamera && inlineCameraMode === "camera" && !inlineStreamRef.current && !isCameraActive) {
      let rafId: number | null = null;
      const timeoutId = setTimeout(() => {
        const checkAndStart = () => {
          if (inlineVideoRef.current && !isCameraActive) {
            console.log("[VoiceAssistant] Auto-starting camera - video ref ready");
            startInlineCamera();
          } else if (!inlineVideoRef.current) {
            rafId = requestAnimationFrame(checkAndStart);
          }
        };
        rafId = requestAnimationFrame(checkAndStart);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (rafId !== null) cancelAnimationFrame(rafId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInlineCamera, inlineCameraMode, startInlineCamera]);

  // Auto-capture timer
  useEffect(() => {
    if (shouldAutoCapture && isCameraActive && !capturedImage && inlineVideoRef.current) {
      setCountdown(3);

      const countdownId = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownId);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      const timerId = setTimeout(() => {
        console.log("[VoiceAssistant] Auto-capturing photo after 3 seconds");
        captureInlinePhoto();
        clearInterval(countdownId);
        setCountdown(null);
        setShouldAutoCapture(false);
      }, 3000);

      return () => {
        clearTimeout(timerId);
        clearInterval(countdownId);
      };
    }
  }, [shouldAutoCapture, isCameraActive, capturedImage, captureInlinePhoto]);

  // Auto-analyze when image is available
  useEffect(() => {
    if (shouldAutoAnalyze && imageFile && !isAnalyzing && !analysisResult) {
      console.log("[VoiceAssistant] Auto-analyzing image after command detection");
      const analyzeTimer = setTimeout(() => {
        if (imageFile && !isAnalyzing) {
          analyzeInlineImage()
            .then(() => {
              setShouldAutoAnalyze(false);
            })
            .catch((err) => {
              console.error("[VoiceAssistant] Error in auto-analyze:", err);
              setShouldAutoAnalyze(false);
            });
        }
      }, 800);

      return () => {
        clearTimeout(analyzeTimer);
      };
    }
  }, [shouldAutoAnalyze, imageFile, isAnalyzing, analysisResult, analyzeInlineImage]);

  // Attach stored stream to video element
  useEffect(() => {
    if (!showInlineCamera || inlineCameraMode !== "camera") return;

    const stream = inlineStreamRef.current;
    if (!stream) return;

    const video = inlineVideoRef.current;
    if (!video) return;
    if (video.srcObject) return;

    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    video.play()
      .then(() => {
        setIsCameraActive(true);
      })
      .catch((err: unknown) => {
        console.warn("[VoiceAssistant] Play failed after stream attachment:", err);
      });
  }, [showInlineCamera, inlineCameraMode]);

  // Monitor video element
  useEffect(() => {
    if (!showInlineCamera || inlineCameraMode !== "camera" || !inlineStreamRef.current) return;

    const video = inlineVideoRef.current;
    if (!video) return;

    const checkAndPlay = () => {
      if (video.srcObject && video.paused && video.readyState >= 2) {
        console.log("[VoiceAssistant] Video has stream but is paused, attempting to play");
        video.play().catch((err) => {
          console.warn("[VoiceAssistant] Failed to play video in monitor:", err);
        });
      }
    };

    checkAndPlay();

    const interval = setInterval(checkAndPlay, 500);

    const handleLoadedMetadata = () => {
      console.log("[VoiceAssistant] Video metadata loaded in monitor");
      checkAndPlay();
    };
    const handleCanPlay = () => {
      console.log("[VoiceAssistant] Video can play in monitor");
      checkAndPlay();
    };
    const handlePlay = () => {
      console.log("[VoiceAssistant] Video started playing in monitor");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);

    return () => {
      clearInterval(interval);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
    };
  }, [showInlineCamera, inlineCameraMode]);

  // Cleanup camera on unmount or when closing
  useEffect(() => {
    if (!showInlineCamera) {
      stopInlineCamera();
      setCapturedImage(null);
      setImageFile(null);
      setAnalysisResult(null);
      setCameraError(null);
      setImageDescription("");
      setShouldAutoAnalyze(false);
    }
    return () => {
      stopInlineCamera();
    };
  }, [showInlineCamera, stopInlineCamera]);

  return {
    // Camera state
    showInlineCamera,
    setShowInlineCamera,
    inlineCameraMode,
    setInlineCameraMode,
    capturedImage,
    setCapturedImage,
    imageFile,
    setImageFile,
    isAnalyzing,
    analysisResult,
    setAnalysisResult,
    isCameraActive,
    shouldAutoCapture,
    setShouldAutoCapture,
    shouldAutoAnalyze,
    setShouldAutoAnalyze,
    imageDescription,
    setImageDescription,

    // Vision
    isVisionActive,
    visionState,
    visionCoaching,
    stopVisionCoaching,

    // Refs
    inlineVideoRef,
    inlineCanvasRef,
    inlineStreamRef,
    inlineFileInputRef,

    // Actions
    startInlineCamera,
    stopInlineCamera,
    captureInlinePhoto,
    handleInlineFileChange,
    analyzeInlineImage,
  };
}
