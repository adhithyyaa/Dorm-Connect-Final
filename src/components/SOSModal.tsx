import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SOSModal() {
  const [open, setOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!roomNumber.trim()) {
      toast.error("Please enter a room number");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("sos_alerts").insert({
      room_number: roomNumber.trim(),
      triggered_by: name.trim() || "Anonymous",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Failed to send SOS alert");
      return;
    }

    toast.success("SOS alert sent! Help is on the way.");
    setRoomNumber("");
    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="gap-2 font-bold animate-pulse-sos">
          <AlertTriangle className="h-5 w-5" />
          SOS Emergency
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Emergency SOS Alert
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will immediately alert all administrators about an emergency in your room.
        </p>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="sos-name">Your Name (optional)</Label>
            <Input id="sos-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sos-room">Room Number *</Label>
            <Input id="sos-room" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. A-101" />
          </div>
          <Button variant="destructive" className="w-full font-bold" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Send SOS Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
