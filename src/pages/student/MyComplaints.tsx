import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "resolved")
    return <Badge className="status-resolved border gap-1"><CheckCircle className="h-3 w-3" /> Resolved</Badge>;
  if (status === "declined")
    return <Badge className="status-declined border gap-1"><XCircle className="h-3 w-3" /> Declined</Badge>;
  return <Badge className="status-pending border gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
}

export default function MyComplaints() {
  const { profile } = useAuth();

  const { data: complaints = [] } = useQuery({
    queryKey: ["my-complaints", profile?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("student_id", profile!.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">My Complaints</h2>
        <p className="text-sm text-muted-foreground mt-1">Track the status of your submitted complaints</p>
      </div>

      {complaints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No complaints submitted yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-medium">Room {c.room_number}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(c.created_at).toLocaleDateString()} at {new Date(c.created_at).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm">{c.description}</p>
                {c.image_url && <img src={c.image_url} alt="Complaint" className="rounded-md max-h-40 border" />}
                {c.status === "resolved" && c.resolution_description && (
                  <div className="bg-success/5 border border-success/20 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-success">Resolution</p>
                    <p className="text-sm">{c.resolution_description}</p>
                    {c.resolution_image_url && <img src={c.resolution_image_url} alt="Resolution" className="rounded-md max-h-32 border" />}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
