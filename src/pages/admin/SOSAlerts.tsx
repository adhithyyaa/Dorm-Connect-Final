import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SOSAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["sos-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sos_alerts")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const handleDismiss = async (id: string) => {
    const { error } = await supabase
      .from("sos_alerts")
      .update({ active: false })
      .eq("id", id);

    if (error) {
      toast.error("Failed to dismiss alert");
      return;
    }
    toast.success("SOS alert dismissed");
    queryClient.invalidateQueries({ queryKey: ["sos-alerts"] });
    queryClient.invalidateQueries({ queryKey: ["sos-count"] });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">SOS Alerts</h2>
        <p className="text-sm text-muted-foreground mt-1">Active emergency alerts from rooms</p>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-10 w-10 mx-auto text-success/40 mb-3" />
            <p className="text-muted-foreground">No active SOS alerts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} className="border-sos/30 bg-sos/5">
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sos/10 flex items-center justify-center animate-pulse-sos">
                    <AlertTriangle className="h-5 w-5 text-sos" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Emergency — Room {a.room_number}</p>
                    <p className="text-xs text-muted-foreground">
                      By {a.triggered_by} • {new Date(a.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDismiss(a.id)}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
