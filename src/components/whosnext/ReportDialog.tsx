import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { REPORT_REASONS, type ReportReason } from "@/lib/whosnext/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerName: string | undefined;
  onSubmit: (reason: ReportReason) => void;
}

export function ReportDialog({ open, onOpenChange, peerName, onSubmit }: Props) {
  const [reason, setReason] = useState<ReportReason>("harassment");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why are you reporting {peerName ?? "this person"}?</DialogTitle>
          <DialogDescription>
            Reports are reviewed by moderation. You'll be moved to a new conversation
            right away.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={reason}
          onValueChange={(v) => setReason(v as ReportReason)}
          className="gap-3 py-2"
        >
          {REPORT_REASONS.map((r) => (
            <div key={r.value} className="flex items-center gap-3">
              <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
              <Label htmlFor={`reason-${r.value}`} className="cursor-pointer font-normal">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onSubmit(reason);
              onOpenChange(false);
            }}
          >
            Submit report &amp; next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
