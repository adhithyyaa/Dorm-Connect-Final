import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, Shield, Clock } from "lucide-react";

export default function AdminManagement() {
  const queryClient = useQueryClient();

  const { data: allAdmins = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      // Primary admin can read all profiles. Filter admins by checking user_roles.
      // We'll fetch all profiles and then check roles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return profiles;
    },
  });

  const { data: adminRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "admin");
      if (error) throw error;
      return data;
    },
  });

  const adminUserIds = new Set(adminRoles.map((r) => r.user_id));
  const adminProfiles = allAdmins.filter((p) => adminUserIds.has(p.user_id));
  const pending = adminProfiles.filter((p) => !p.approved);
  const approved = adminProfiles.filter((p) => p.approved);

  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ approved: true })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to approve admin");
      return;
    }
    toast.success("Admin approved");
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  const handleReject = async (userId: string) => {
    // Delete the profile and auth user will cascade
    // We need to use an edge function or just remove the profile
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to reject admin");
      return;
    }
    toast.success("Admin rejected");
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Admin Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Approve or reject admin registrations</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            Pending Approvals
            {pending.length > 0 && <Badge className="status-pending border ml-1">{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 pb-4">No pending admin requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.username}</TableCell>
                    <TableCell><Badge className="status-pending border text-xs">Pending</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleApprove(a.user_id)} className="gap-1">
                          <CheckCircle className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(a.user_id)} className="gap-1 text-destructive hover:text-destructive">
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            Approved Admins
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 pb-4">No approved admins yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.username}</TableCell>
                    <TableCell><Badge className="status-resolved border text-xs">Active</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
