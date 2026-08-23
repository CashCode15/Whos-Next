import { useCallback, useEffect, useRef, useState } from "react";

export interface LocalMedia {
  stream: MediaStream | null;
  error: string | null;
  micOn: boolean;
  cameraOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  flipCamera: () => void;
  stop: () => void;
}

/** Owns getUserMedia: the local half of the WebRTC peer connection. */
export function useLocalMedia(): LocalMedia {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const facing = useRef<"user" | "environment">("user");
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing.current, width: { ideal: 1280 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = next;
      setStream(next);
      setError(null);
    } catch {
      setError("Camera and microphone access is required to start a conversation.");
    }
  }, []);

  useEffect(() => {
    void start();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [start]);

  const toggleMic = useCallback(() => {
    setMicOn((on) => {
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraOn((on) => {
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  }, []);

  const flipCamera = useCallback(() => {
    facing.current = facing.current === "user" ? "environment" : "user";
    void start();
  }, [start]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  return { stream, error, micOn, cameraOn, toggleMic, toggleCamera, flipCamera, stop };
}
