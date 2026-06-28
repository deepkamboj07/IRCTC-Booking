import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../../shared/components/ui/dialog";
import { useCancelBooking } from "../../../../shared/api/bookings.api";
import { extractError } from "../../../../shared/utils/extractError";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  pnr: string;
  onSuccess?: () => void;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingId,
  pnr,
  onSuccess,
}: CancelBookingDialogProps) {
  const [error, setError] = useState("");
  const cancelBooking = useCancelBooking();

  async function handleCancel() {
    setError("");
    try {
      await cancelBooking.mutateAsync(bookingId);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(extractError(err));
    }
  }

  function handleClose() {
    if (cancelBooking.isPending) return;
    setError("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!cancelBooking.isPending) onOpenChange(v); }}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-base font-semibold text-slate-800">
              Cancel Booking
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500 mt-1 pl-13">
            Are you sure you want to cancel booking{" "}
            <span className="font-mono font-bold text-slate-700">{pnr}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={cancelBooking.isPending}
          >
            Keep Booking
          </Button>
          <Button
            onClick={handleCancel}
            disabled={cancelBooking.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {cancelBooking.isPending ? "Cancelling…" : "Yes, Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
