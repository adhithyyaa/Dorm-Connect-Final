import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export default function RegisterRoom() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [rollNumber, setRollNumber] = useState(profile?.roll_number || "");
  const [roomNumber, setRoomNumber] = useState(profile?.room_number || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [submitting, setSubmitting] = useState(false);

  const isRegistered = !!(profile?.roll_number && profile?.room_number);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNumber.trim() || !roomNumber.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!profile) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        roll_number: rollNumber.trim(),
        room_number: roomNumber.trim(),
        email: email.trim(),
      })
      .eq("user_id", profile.user_id);
    setSubmitting(false);

    if (error) {
      toast.error("Failed to save details");
      return;
    }
    await refreshProfile();
    toast.success("Room details saved successfully!");
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Register Room</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRegistered ? "Update your personal and room details" : "Register your personal details and room number"}
        </p>
      </div>

      {isRegistered && (
        <div className="mb-4 flex items-center gap-2 text-sm text-success bg-success/10 rounded-lg px-3 py-2">
          <CheckCircle className="h-4 w-4" />
          Room {profile?.room_number} registered successfully
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Personal Details</CardTitle>
          <CardDescription>This information will be visible to admins</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roll">Roll Number</Label>
                <Input id="roll" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 21CS101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room Number</Label>
                <Input id="room" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. A-101" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email ID</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : isRegistered ? "Update Details" : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
