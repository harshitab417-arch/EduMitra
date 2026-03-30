# EduMitra Feature-to-Issue Mapping

This document explains how EduMitra features solve four core NGO tutoring problems.

---

## 1) No Structured Learning Support

### Problem
Volunteer-led sessions are ad hoc and inconsistent, with no continuity from one mentor to another.

### EduMitra Features That Solve It
- **Resources module (`/resources`)**
  - Structured lesson plans by subject/topic/grade
  - Clear plan details: objectives, activities, practice questions, duration
- **Start Session from lesson plan**
  - Mentors start session directly from the selected plan
  - Session form pre-fills topic/subject context
- **Pin to Student**
  - Mentors can pin relevant lesson plans for follow-up

### Practical Outcome
Mentors follow a repeatable format instead of improvising each time, and session continuity is preserved in data.

---

## 2) No Progress Tracking System

### Problem
Teams cannot see whether a student is improving, stagnating, or slipping behind.

### EduMitra Features That Solve It
- **Session logging**
  - Every session creates persistent records in `sessions` and `progress`
- **Milestone tracker**
  - `student_milestones` stores topic-level status:
    - `not_started`
    - `in_progress`
    - `completed`
    - `flagged`
- **Status controls on Students page**
  - Mentors/Admin can set student risk status (`on_track`, `at_risk`, `flagged`)
  - Stored through `gap_alerts` and reflected in UI
- **Progress visualization**
  - Student/Admin/Impact dashboards read historical progress trends

### Practical Outcome
Improvement is measurable and visible early enough for intervention.

---

## 3) Poor Mentor-Student Matching

### Problem
Students are assigned randomly without considering subject fit or mentor capability.

### EduMitra Features That Solve It
- **Mentor profile setup**
  - Expertise + availability are captured and editable
- **Student profile setup**
  - Grade, subjects, level, location are captured and editable
- **Matching page (`/matching`)**
  - Runs weighted, explainable scoring from `src/lib/matcher.ts`
  - Saves active matches to database for role dashboards
- **Mentor-side filtering**
  - Mentor student list displays students aligned with mentor subjects
- **Session subject restriction**
  - Mentors can log sessions only for subjects in their expertise

### Practical Outcome
Assignments are relevant, defendable, and operationally consistent.

---

## 4) Lack of Impact Visibility for NGOs

### Problem
Organizations cannot reliably present outcomes to stakeholders/funders.

### EduMitra Features That Solve It
- **Admin dashboard**
  - Student/mentor/session metrics
  - Risk visibility and engagement indicators
- **Impact page**
  - Session activity trends, grade distribution, progress trends
- **Centralized write-to-read pipeline**
  - Data entered by mentors (session logs, milestones, statuses) powers admin reporting

### Practical Outcome
Program outcomes become visible, auditable, and easier to communicate.

---

## End-to-End Value Loop

EduMitra’s strategic loop:

**Mentor logs session -> Milestone/progress updates -> Gap status updates -> Dashboard reflects impact**

This is the core mechanism that connects day-to-day mentoring actions to NGO-level visibility and scale.

