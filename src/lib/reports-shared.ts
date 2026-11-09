/** Месечният отчет за директора — типове за сървъра и браузъра. */

export interface ReportCounts {
  games: number;
  lessons: number;
  printables: number;
  /** Споделени с колегите от създадените този месец */
  shared: number;
  tried: number;
  showcaseApproved: number;
  showcaseProposed: number;
  parentApproved: number;
  parentProposed: number;
  files: number;
}

export interface ReportItem {
  type: string;
  title: string;
  /** „ГГГГ-ММ-ДД“ */
  date: string;
  note: string | null;
}

export interface TeacherReport {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  group: string;
  isAdmin: boolean;
  counts: ReportCounts;
  /** Общо дейности през месеца — за лентата „активност“ */
  total: number;
  items: ReportItem[];
}

export interface MonthlyReport {
  ym: string;
  teachers: TeacherReport[];
  totals: ReportCounts;
}

/** Последните месеци за избор (най-новият първи), „ГГГГ-ММ“. */
export function recentMonths(count = 12, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}
