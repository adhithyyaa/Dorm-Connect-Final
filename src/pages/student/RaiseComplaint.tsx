import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, ImageIcon } from "lucide-react";

export default function RaiseComplaint() {
  const { profile } = useAuth();
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.room_number) {
      toast.error("Please register your room first");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a complaint description");
      return;
    }

    setSubmitting(true);
    let imageUrl: string | undefined;

    // Upload image if provided
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `complaints/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-images")
        .upload(path, imageFile);

      if (uploadError) {
        toast.error("Failed to upload image");
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("complaint-images")
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("complaints").insert({
      student_id: profile.user_id,
      student_name: profile.name || profile.username,
      room_number: profile.room_number,
      description: description.trim(),
      image_url: imageUrl,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit complaint");
      return;
    }

    toast.success("Complaint submitted successfully!");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!profile?.room_number) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-2">Raise Complaint</h2>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please register your room details first before raising a complaint.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Raise Complaint</h2>
        <p className="text-sm text-muted-foreground mt-1">Submit a complaint for Room {profile.room_number}</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">New Complaint</CardTitle>
          <CardDescription>Describe the issue and optionally attach an image</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Attach Image (optional)</Label>
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-md" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-sm">Click to upload image</span>
                    <span className="text-xs">Max 5MB</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <Upload className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
