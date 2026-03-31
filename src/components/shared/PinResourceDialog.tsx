import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resourceMap } from "@/lib/resourceMap";

const schema = z.object({
  studentId: z.string().min(1, "Select a student"),
  notes: z.string().optional(),
});

export default function PinResourceDialog({
  open,
  onOpenChange,
  lessonPlanId,
  lessonTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonPlanId: string;
  lessonTitle: string;
}) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { studentId: "", notes: "" },
  });

  const lessonSubject = useMemo(
    () => resourceMap.find((r) => r.id === lessonPlanId)?.subject ?? null,
    [lessonPlanId],
  );

  const { data: myStudent } = useQuery({
    queryKey: ["pin-resource-my-student", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,subjects").eq("user_id", user!.id).single();
      if (error) throw error;
      return data as { id: string; subjects: string[] };
    },
    enabled: open && profile?.role === "student" && !!user,
  });

  const { data: students } = useQuery({
    queryKey: ["pin-resource-students", profile?.role, myStudent?.subjects],
    queryFn: async () => {
      const [{ data: studentsData, error: studentsError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase.from("students").select("id,user_id,grade,subjects"),
          supabase.from("profiles").select("user_id,name"),
        ]);
      if (studentsError) throw studentsError;
      if (profilesError) throw profilesError;

      const nameByUserId = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameByUserId.set(p.user_id, p.name));

      const normalizedMySubjects = new Set((myStudent?.subjects || []).map((s) => s.toLowerCase()));
      const normalizedLessonSubject = lessonSubject?.toLowerCase() ?? null;

      return (studentsData || [])
        .filter((s: any) => {
          if (profile?.role !== "student") return true;
          const subjects = (s.subjects || []).map((sub: string) => sub.toLowerCase());
          const overlaps = subjects.some((sub: string) => normalizedMySubjects.has(sub));
          if (!overlaps) return false;
          if (!normalizedLessonSubject) return true;
          return subjects.includes(normalizedLessonSubject);
        })
        .map((s: any) => ({
        id: s.id,
        grade: s.grade,
        subjects: s.subjects || [],
        name: nameByUserId.get(s.user_id) || "Student",
        }));
    },
    enabled: open && (profile?.role !== "student" || !!myStudent),
  });

  const selectedStudentId = form.watch("studentId");
  const selectedStudent = useMemo(
    () => students?.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  const pinMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!user) throw new Error("Not signed in");
      if (profile?.role === "student") throw new Error("Students are not allowed to pin resources.");

      const { error } = await supabase.from("student_resources").insert({
        student_id: values.studentId,
        lesson_plan_id: lessonPlanId,
        pinned_by: user.id,
        notes: values.notes ?? "",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Pinned", description: "Resource pinned to student." });
      await queryClient.invalidateQueries({ queryKey: ["student-resources"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to pin resource", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pin to student</DialogTitle>
          <DialogDescription>
            Pin <span className="font-medium">{lessonTitle}</span> to a student so it stays visible for future sessions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => pinMutation.mutate(v))}>
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {(students || []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} (Grade {s.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Why you pinned this, what to focus on next time…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-muted-foreground">
              Selected: {selectedStudent ? `${selectedStudent.name} (Grade ${selectedStudent.grade})` : "—"}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pinMutation.isPending}>
                {pinMutation.isPending ? "Pinning..." : "Pin"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

