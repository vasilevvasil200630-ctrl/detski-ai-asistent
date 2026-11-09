import type { AgeGroup, LessonDirection, MaterialKind } from "@/types";

/** Учебната година започва на 1 септември: ноември 2026 → 2026 (2026/2027), март 2027 → 2026. */
export function schoolYearOf(d: Date): number {
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

export function schoolYearLabel(year: number): string {
  return `${year}/${year + 1}`;
}

export interface PortfolioData {
  year: number;
  teacher: { name: string; jobTitle: string; groupName: string; ageGroup: AgeGroup; kindergarten: string };
  totals: {
    materials: number;
    byKind: Record<MaterialKind, number>;
    byDirection: Record<string, number>;
    gamesWithTasks: number;
    shared: number;
    likes: number;
    copies: number;
    tried: number;
    showcase: number;
    files: number;
    filesShared: number;
  };
  topLiked: { id: string; title: string; kind: MaterialKind; likes: number }[];
  tried: { id: string; title: string; kind: MaterialKind; ageGroup: AgeGroup; direction: LessonDirection | null; at: string; note: string }[];
  showcase: { id: string; title: string; kind: MaterialKind; activity: boolean; at: string }[];
}
