import {
  Camera,
  CameraOff,
  Flag,
  Mic,
  MicOff,
  Settings,
  ShieldBan,
  SkipForward,
  SwitchCamera,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface Props {
  micOn: boolean;
  cameraOn: boolean;
  canModerate: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onReport: () => void;
  onBlock: () => void;
  onNext: () => void;
}

export function VideoControls({
  micOn,
  cameraOn,
  canModerate,
  onToggleMic,
  onToggleCamera,
  onFlipCamera,
  onReport,
  onBlock,
  onNext,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 p-2 backdrop-blur">
      <Button size="icon" variant={micOn ? "secondary" : "destructive"} onClick={onToggleMic} title="Microphone">
        {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
      </Button>
      <Button size="icon" variant={cameraOn ? "secondary" : "destructive"} onClick={onToggleCamera} title="Camera">
        {cameraOn ? <Camera className="size-4" /> : <CameraOff className="size-4" />}
      </Button>
      <Button size="icon" variant="secondary" onClick={onFlipCamera} title="Flip camera" className="sm:hidden">
        <SwitchCamera className="size-4" />
      </Button>
      <Button size="icon" variant="secondary" asChild title="Settings">
        <Link to="/settings">
          <Settings className="size-4" />
        </Link>
      </Button>
      <Button size="icon" variant="secondary" onClick={onReport} disabled={!canModerate} title="Report">
        <Flag className="size-4" />
      </Button>
      <Button size="icon" variant="secondary" onClick={onBlock} disabled={!canModerate} title="Block">
        <ShieldBan className="size-4" />
      </Button>

      <Button className="ml-auto font-display" onClick={onNext}>
        Who&apos;s Next? <SkipForward className="ml-1 size-4" />
      </Button>
    </div>
  );
}
