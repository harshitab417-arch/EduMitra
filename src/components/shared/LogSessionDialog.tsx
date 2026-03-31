import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
  mentorId: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  lessonPlanId: z.string().optional(),
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
  status: z.enum(["completed", "scheduled"]),
});

export type LogSessionDefaults = Partial<z.infer<typeof schema>> & { studentId?: string };

export default function LogSessionDialog({
  open,
  onOpenChange,
  defaults,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: LogSessionDefaults;
}) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [score, setScore] = useState<number>(defaults?.score ?? 70);
  const [studentSearch, setStudentSearch] = useState("");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentIds: defaults?.studentIds ?? (defaults?.studentId ? [defaults.studentId] : []),
      mentorId: defaults?.mentorId,
      subject: defaults?.subject ?? "",
      topic: defaults?.topic ?? "",
      lessonPlanId: defaults?.lessonPlanId,
      score: defaults?.score ?? 70,
      notes: defaults?.notes ?? "",
      status: defaults?.status ?? "completed",
    },
  });

  useEffect(() => {
    form.setValue("score", score);
  }, [score, form]);

  const { data: students } = useQuery({
    queryKey: ["log-session-students"],
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

      return (studentsData || []).map((s: any) => ({
        id: s.id,
        grade: s.grade,
        subjects: s.subjects || [],
        name: nameByUserId.get(s.user_id) || "Student",
      }));
    },
    enabled: open,
  });

  const { data: mentors } = useQuery({
    queryKey: ["log-session-mentors"],
    queryFn: async () => {
      const [{ data: mentorsData, error: mentorsError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase.from("mentors").select("id,user_id"),
          supabase.from("profiles").select("user_id,name"),
        ]);
      if (mentorsError) throw mentorsError;
      if (profilesError) throw profilesError;

      const nameByUserId = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameByUserId.set(p.user_id, p.name));

      return (mentorsData || []).map((m: any) => ({
        id: m.id,
        name: nameByUserId.get(m.user_id) || "Mentor",
      }));
    },
    enabled: open && profile?.role === "admin",
  });

  const { data: myMentor } = useQuery({
    queryKey: ["log-session-my-mentor", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("mentors").select("id,expertise").eq("user_id", user!.id).single();
      if (error) throw error;
      return data as { id: string; expertise: string[] };
    },
    enabled: open && profile?.role === "mentor" && !!user,
  });

  const { data: myStudent } = useQuery({
    queryKey: ["log-session-my-student", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,subjects").eq("user_id", user!.id).single();
      if (error) throw error;
      return data as { id: string; subjects: string[] };
    },
    enabled: open && profile?.role === "student" && !!user,
  });

  const selectedStudentIds = form.watch("studentIds");
  const mentorSubjects = (myMentor?.expertise || []).filter(Boolean);
  const studentSubjects = (myStudent?.subjects || []).filter(Boolean);
  const selectedSubject = form.watch("subject");

  const visibleStudents = useMemo(() => {
    let base = students || [];

    if (profile?.role === "student") {
      const mySubjects = studentSubjects.map((s) => s.toLowerCase());
      if (!mySubjects.length) {
        base = [];
      } else {
        base = base.filter((s: any) =>
          (s.subjects || []).some((sub: string) => mySubjects.includes(sub.toLowerCase())),
        );
      }
    }

    const searched = base.filter((s: any) => s.name.toLowerCase().includes(studentSearch.toLowerCase()));

    if (profile?.role !== "mentor" || !selectedSubject) return searched;
    return searched.filter((s: any) =>
      (s.subjects || []).some((sub: string) => sub.toLowerCase() === selectedSubject.toLowerCase()),
    );
  }, [students, studentSearch, profile?.role, selectedSubject, studentSubjects]);

  const allVisibleSelected =
    visibleStudents.length > 0 && visibleStudents.every((s: any) => selectedStudentIds.includes(s.id));

  useEffect(() => {
    if (profile?.role === "mentor" && mentorSubjects.length > 0) {
      const current = form.getValues("subject");
      if (!current || !mentorSubjects.includes(current)) {
        form.setValue("subject", mentorSubjects[0]);
      }
    }
  }, [profile?.role, mentorSubjects, form]);

  useEffect(() => {
    if (profile?.role === "student" && studentSubjects.length > 0) {
      const current = form.getValues("subject");
      if (!current || !studentSubjects.includes(current)) {
        form.setValue("subject", studentSubjects[0]);
      }
    }
  }, [profile?.role, studentSubjects, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!user) throw new Error("Not signed in");

      if (profile?.role === "mentor") {
        const expertise = (myMentor?.expertise || []).map((s) => s.toLowerCase());
        if (!expertise.includes(values.subject.toLowerCase())) {
          throw new Error("You can only log subjects from your mentor expertise.");
        }
      }
      if (profile?.role === "student") {
        const allowed = studentSubjects.map((s) => s.toLowerCase());
        if (!allowed.includes(values.subject.toLowerCase())) {
          throw new Error("You can only log subjects from your student setup.");
        }
      }

      const studentsById = new Map((students || []).map((s) => [s.id, s]));

      const mentorByStudentId = new Map<string, string>();
      if (profile?.role === "student") {
        const { data: activeMatches, error: matchesError } = await supabase
          .from("matches")
          .select("student_id,mentor_id")
          .eq("status", "active")
          .in("student_id", values.studentIds);
        if (matchesError) throw matchesError;
        (activeMatches || []).forEach((m: any) => {
          if (!mentorByStudentId.has(m.student_id)) mentorByStudentId.set(m.student_id, m.mentor_id);
        });
      }

      const status: "not_started" | "in_progress" | "completed" | "flagged" =
        values.score >= 75 ? "completed" : values.score >= 40 ? "in_progress" : "flagged";

      for (const studentId of values.studentIds) {
        const mentorId =
          profile?.role === "mentor"
            ? myMentor?.id
            : profile?.role === "student"
              ? mentorByStudentId.get(studentId)
              : values.mentorId;
        if (!mentorId) {
          throw new Error("No active mentor match found for selected student. Ask admin to run matching first.");
        }

        const student = studentsById.get(studentId);
        const grade = student?.grade ?? null;
        if (!grade) throw new Error("Student grade not found");

        // Ensure a topic exists in learning_topics for this student's grade.
        const { data: existingTopic, error: topicFindError } = await supabase
          .from("learning_topics")
          .select("id")
          .eq("grade", grade)
          .eq("subject", values.subject)
          .eq("topic", values.topic)
          .maybeSingle();
        if (topicFindError) throw topicFindError;

        let topicId = existingTopic?.id as string | undefined;
        if (!topicId) {
          const { data: createdTopic, error: topicCreateError } = await supabase
            .from("learning_topics")
            .insert({
              grade,
              subject: values.subject,
              topic: values.topic,
              sort_order: 0,
              lesson_plan_id: values.lessonPlanId ?? null,
            })
            .select("id")
            .single();
          if (topicCreateError) throw topicCreateError;
          topicId = createdTopic.id as string;
        }

        const { error: sessionError } = await supabase.from("sessions").insert({
          student_id: studentId,
          mentor_id: mentorId,
          topic: values.topic,
          notes: values.notes ?? "",
          status: values.status,
        });
        if (sessionError) throw sessionError;

        const { error: progressError } = await supabase.from("progress").insert({
          student_id: studentId,
          subject: values.subject,
          topic: values.topic,
          score: values.score,
        });
        if (progressError) throw progressError;

        const { error: milestoneError } = await supabase.from("student_milestones").upsert(
          {
            student_id: studentId,
            topic_id: topicId,
            status,
            last_session_at: new Date().toISOString(),
            last_score: values.score,
          },
          { onConflict: "student_id,topic_id" },
        );
        if (milestoneError) throw milestoneError;
      }
    },
    onSuccess: async () => {
      toast({ title: "Session logged", description: "Milestone and progress updated." });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["all-sessions-page"] }),
        queryClient.invalidateQueries({ queryKey: ["all-students-page"] }),
        queryClient.invalidateQueries({ queryKey: ["student-milestones"] }),
        queryClient.invalidateQueries({ queryKey: ["log-session-students"] }),
      ]);
      onOpenChange(false);
      form.reset({
        studentIds: [],
        mentorId: "",
        subject:
          profile?.role === "mentor"
            ? (mentorSubjects[0] || "")
            : profile?.role === "student"
              ? (studentSubjects[0] || "")
              : "",
        topic: "",
        lessonPlanId: "",
        score: 70,
        notes: "",
        status: "completed",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to log session", variant: "destructive" });
    },
  });

  const mentorRequired = profile?.role === "admin";
  const showMentorSelect = mentorRequired;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Log Session</DialogTitle>
          <DialogDescription>Fast session log that updates milestones automatically.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate({ ...values, score }))}
          >
            <FormField
              control={form.control}
              name="studentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Students</FormLabel>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search by student name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const current = form.getValues("studentIds");
                        const visibleIds = visibleStudents.map((s: any) => s.id);
                        if (allVisibleSelected) {
                          const visibleSet = new Set(visibleIds);
                          form.setValue(
                            "studentIds",
                            current.filter((id) => !visibleSet.has(id)),
                            { shouldValidate: true },
                          );
                          return;
                        }
                        const merged = new Set([...current, ...visibleIds]);
                        form.setValue("studentIds", Array.from(merged), { shouldValidate: true });
                      }}
                    >
                      {allVisibleSelected ? "Clear visible" : "Select all visible"}
                    </Button>
                  </div>
                  <FormControl>
                    <div className="max-h-44 overflow-auto rounded-md border border-input p-3 space-y-2">
                      {visibleStudents.map((s: any) => {
                        const checked = selectedStudentIds.includes(s.id);
                        return (
                          <label key={s.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                const current = form.getValues("studentIds");
                                const next = isChecked
                                  ? [...current, s.id]
                                  : current.filter((id) => id !== s.id);
                                form.setValue("studentIds", next, { shouldValidate: true });
                              }}
                            />
                            <span>{s.name} (Grade {s.grade})</span>
                          </label>
                        );
                      })}
                      {visibleStudents.length === 0 && (
                        <p className="text-xs text-muted-foreground">No students match current filters.</p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showMentorSelect && (
              <FormField
                control={form.control}
                name="mentorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mentor</FormLabel>
                    <FormControl>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mentor" />
                        </SelectTrigger>
                        <SelectContent>
                          {(mentors || []).map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      {profile?.role === "mentor" ? (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {mentorSubjects.map((subj) => (
                              <SelectItem key={subj} value={subj}>
                                {subj}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : profile?.role === "student" ? (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {studentSubjects.map((subj) => (
                              <SelectItem key={subj} value={subj}>
                                {subj}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="e.g., Mathematics" {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">completed</SelectItem>
                          <SelectItem value="scheduled">scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fractions & Decimals" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Progress rating</p>
                <p className="text-sm text-muted-foreground">{score}%</p>
              </div>
              <Slider
                value={[score]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setScore(v[0] ?? 0)}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes for the NGO / future mentors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

