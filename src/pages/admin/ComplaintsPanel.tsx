import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, ClipboardList, ImageIcon } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "resolved")
    return <Badge className="status-resolved border gap-1"><CheckCircle className="h-3 w-3" /> Resolved</Badge>;
  if (status === "declined")
    return <Badge className="status-declined border gap-1"><XCircle className="h-3 w-3" /> Declined</Badge>;
  return <Badge className="status-pending border gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
}

export default function ComplaintsPanel() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resDesc, setResDesc] = useState("");
  const [resImageFile, setResImageFile] = useState<File | null>(null);
  const [resImagePreview, setResImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: complaints = [] } = useQuery({
    queryKey: ["all-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleResolve = async () => {
    if (!resDesc.trim()) {
      toast.error("Please enter a resolution description");
      return;
    }
    if (!resolveId || !profile) return;

    setSubmitting(true);
    let resolutionImageUrl: string | undefined;

    if (resImageFile) {
      const ext = resImageFile.name.split(".").pop();
      const path = `resolutions/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-images")
        .upload(path, resImageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("complaint-images")
          .getPublicUrl(path);
        resolutionImageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from("complaints")
      .update({
        status: "resolved",
        admin_id: profile.user_id,
        resolution_description: resDesc.trim(),
        resolution_image_url: resolutionImageUrl,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", resolveId);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to resolve complaint");
      return;
    }

    toast.success("Complaint resolved");
    setResolveId(null);
    setResDesc("");
    setResImageFile(null);
    setResImagePreview(null);
    queryClient.invalidateQueries({ queryKey: ["all-complaints"] });
  };

  const handleDecline = async (id: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from("complaints")
      .update({
        status: "declined",
        admin_id: profile.user_id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to decline complaint");
      return;
    }
    toast.success("Complaint declined");
    queryClient.invalidateQueries({ queryKey: ["all-complaints"] });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setResImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Sort: pending first
  const sorted = [...complaints].sort((a, b) => {
    const order: Record<string, number> = { pending: 0, resolved: 1, declined: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Complaints</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage student complaints</p>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No complaints yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-medium">{c.student_name} — Room {c.room_number}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm">{c.description}</p>
                {c.image_url && <img src={c.image_url} alt="Complaint" className="rounded-md max-h-40 border" />}
                {c.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => setResolveId(c.id)} className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Resolve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecline(c.id)} className="gap-1 text-destructive hover:text-destructive">
                      <XCircle className="h-3 w-3" /> Decline
                    </Button>
                  </div>
                )}
                {c.status === "resolved" && c.resolution_description && (
                  <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-success mb-1">Resolution</p>
                    <p className="text-sm">{c.resolution_description}</p>
                    {c.resolution_image_url && <img src={c.resolution_image_url} alt="Resolution" className="rounded-md max-h-32 border mt-2" />}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!resolveId} onOpenChange={(open) => { if (!open) { setResolveId(null); setResDesc(""); setResImageFile(null); setResImagePreview(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Description</Label>
              <Textarea value={resDesc} onChange={(e) => setResDesc(e.target.value)} placeholder="Describe the resolution..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Resolution Image (optional)</Label>
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                {resImagePreview ? (
                  <img src={resImagePreview} alt="Resolution" className="max-h-32 mx-auto rounded-md" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">Click to upload</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
            <Button onClick={handleResolve} className="w-full" disabled={submitting}>
              {submitting ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
