import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

export default function ViewStudents() {
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      // Fetch profiles that have role = student via a join approach
      // Since we can read all profiles as admin, filter by those with room_number
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("room_number", "is", null)
        .order("room_number");
      if (error) throw error;
      return data;
    },
  });

  // Group by room
  const byRoom: Record<string, typeof students> = {};
  students.forEach((s) => {
    const room = s.room_number || "Unassigned";
    if (!byRoom[room]) byRoom[room] = [];
    byRoom[room].push(s);
  });

  const rooms = Object.keys(byRoom).sort();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Students</h2>
        <p className="text-sm text-muted-foreground mt-1">View registered students by room number</p>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No students registered yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <Card key={room}>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <h3 className="text-sm font-semibold">Room {room}</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byRoom[room].map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.roll_number}</TableCell>
                        <TableCell className="text-muted-foreground">{s.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
