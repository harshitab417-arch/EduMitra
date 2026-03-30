// Smart Mentor-Student Matching Algorithm

export interface StudentProfile {
  id: string;
  user_id: string;
  grade: number;
  subjects: string[];
  baseline_level: string;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  expertise: string[];
  availability: string[];
  name?: string;
}

export interface MatchResult {
  student_id: string;
  mentor_id: string;
  match_score: number;
  reasons: string[];
}

export function calculateMatchScore(
  student: StudentProfile,
  mentor: MentorProfile
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Subject overlap (0-50 points)
  const subjectOverlap = student.subjects.filter((s) =>
    mentor.expertise.includes(s)
  );
  const subjectScore = Math.min(
    (subjectOverlap.length / Math.max(student.subjects.length, 1)) * 50,
    50
  );
  score += subjectScore;
  if (subjectOverlap.length > 0) {
    reasons.push(`Matches ${subjectOverlap.length} subject(s): ${subjectOverlap.join(', ')}`);
  }

  // Baseline level consideration (0-30 points)
  // Students with lower baseline benefit more from experienced mentors
  const levelScores: Record<string, number> = {
    beginner: 30,
    intermediate: 20,
    advanced: 10,
  };
  const levelScore = levelScores[student.baseline_level] || 15;
  score += levelScore;
  if (student.baseline_level === 'beginner') {
    reasons.push('Priority match: student needs foundational support');
  }

  // Availability bonus (0-20 points)
  if (mentor.availability && mentor.availability.length > 0) {
    const availScore = Math.min(mentor.availability.length * 5, 20);
    score += availScore;
    reasons.push(`Mentor available ${mentor.availability.length} slot(s)/week`);
  }

  return {
    student_id: student.id,
    mentor_id: mentor.id,
    match_score: Math.round(score),
    reasons,
  };
}

export function findBestMatches(
  students: StudentProfile[],
  mentors: MentorProfile[],
  maxPerMentor = 5
): MatchResult[] {
  const allMatches: MatchResult[] = [];

  for (const student of students) {
    const studentMatches = mentors
      .map((mentor) => calculateMatchScore(student, mentor))
      .sort((a, b) => b.match_score - a.match_score);

    if (studentMatches.length > 0) {
      allMatches.push(studentMatches[0]);
    }
  }

  // Ensure no mentor gets more than maxPerMentor students
  const mentorCounts: Record<string, number> = {};
  return allMatches.filter((m) => {
    mentorCounts[m.mentor_id] = (mentorCounts[m.mentor_id] || 0) + 1;
    return mentorCounts[m.mentor_id] <= maxPerMentor;
  });
}

// Risk scoring for students
export function calculateRiskScore(
  attendanceRate: number,
  avgScore: number,
  recentTrend: number // -1 to 1, negative means declining
): { score: number; level: 'low' | 'medium' | 'high'; factors: string[] } {
  let risk = 0;
  const factors: string[] = [];

  if (attendanceRate < 0.6) {
    risk += 40;
    factors.push('Low attendance');
  } else if (attendanceRate < 0.8) {
    risk += 20;
    factors.push('Irregular attendance');
  }

  if (avgScore < 40) {
    risk += 35;
    factors.push('Below passing scores');
  } else if (avgScore < 60) {
    risk += 15;
    factors.push('Below average scores');
  }

  if (recentTrend < -0.3) {
    risk += 25;
    factors.push('Declining performance');
  } else if (recentTrend < 0) {
    risk += 10;
    factors.push('Slight decline');
  }

  return {
    score: Math.min(risk, 100),
    level: risk >= 60 ? 'high' : risk >= 30 ? 'medium' : 'low',
    factors,
  };
}
