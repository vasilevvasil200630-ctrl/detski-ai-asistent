import "server-only";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ISectionOptions,
} from "docx";
import { KG_SIGNATURE } from "@/config/kindergarten";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import { taskLine } from "@/services/gameTasks";
import { isPrintable, printableToText, SHEET_KIND_LABELS } from "@/services/printables";
import type { AgeGroup, GeneratedGame, GeneratedLessonPlan, LessonDirection, MaterialKind } from "@/types";

/**
 * Word (.docx) за план-конспекти, игри и материали: учителят го отваря и редактира в Word
 * и го предава като документ. Шрифт Times New Roman 12, полета 2 см — както в повечето градини.
 */

export interface DocxInput {
  kind: MaterialKind;
  title: string;
  ageGroup: AgeGroup;
  direction: LessonDirection | null;
  content: unknown;
}

const FONT = "Times New Roman";
const p = (text: string, opts: { bold?: boolean; italics?: boolean; after?: number } = {}) =>
  new Paragraph({ spacing: { after: opts.after ?? 120 }, children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })] });
const labeled = (label: string, text: string) =>
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(text)] });
const h = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) =>
  new Paragraph({ heading: level, spacing: { before: 240, after: 120 }, children: [new TextRun({ text, font: FONT, color: "000000" })] });
const bullets = (items: string[]) => items.filter(Boolean).map((t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun(t)] }));
const numbered = (items: string[]) => items.filter(Boolean).map((t, i) => p(`${i + 1}. ${t}`, { after: 80 }));

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
function table(head: string[], rows: string[][], widths: number[]): Table {
  const cell = (text: string, bold = false, width = 0) =>
    new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: text.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, bold })] })),
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, true, widths[i] ?? 0)) }),
      ...rows.map((r) => new TableRow({ children: r.map((t, i) => cell(t, false, widths[i] ?? 0)) })),
    ],
  });
}

function header(input: DocxInput): Paragraph[] {
  const dir = directionLabel(input.direction);
  return [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [new TextRun({ text: `${KG_SIGNATURE} · ${AGE_SHORT[input.ageGroup]}${dir ? ` · ${dir}` : ""}`, size: 20, color: "555555" })],
    }),
  ];
}

function lessonBody(plan: GeneratedLessonPlan): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `ПЛАН-КОНСПЕКТ`, font: FONT, color: "000000" })] }),
    labeled("Тема", plan.topic),
    labeled("Възрастова група", plan.ageGroupLabel),
    labeled("Образователно направление", plan.directionLabel),
    labeled("Образователно ядро", plan.educationalCore),
    labeled("Продължителност", plan.totalDuration),
  ];
  if (plan.organizationForm) out.push(labeled("Форма на организация", plan.organizationForm));
  if (plan.programMaterial) out.push(labeled("Познавателна книжка", plan.programMaterial));
  out.push(h("Цели"), ...numbered(plan.goals));
  out.push(
    h("Очаквани резултати"),
    labeled("Знания", plan.expectedResults.knowledge),
    labeled("Умения", plan.expectedResults.skills),
    labeled("Отношения", plan.expectedResults.attitudes),
  );
  out.push(h("Материали"), ...bullets(plan.materials));
  if (plan.integrativeLinks?.length) out.push(h("Интегративни връзки"), ...bullets(plan.integrativeLinks));
  out.push(
    h("Ход на педагогическата ситуация"),
    table(
      ["Част", "Дейност на учителя", "Дейност на децата"],
      plan.stages.map((s) => [`${s.phase}${s.duration ? `\n${s.duration}` : ""}`, s.teacherAction, s.childrenActivity]),
      [20, 40, 40],
    ),
  );
  if (plan.story?.paragraphs?.length) {
    out.push(h(`Приказка: „${plan.story.title}“`), ...plan.story.paragraphs.map((x) => p(x)));
    if (plan.story.moral) out.push(p(`Поука: ${plan.story.moral}`, { italics: true }));
    if (plan.story.discussionQuestions?.length) out.push(p("Въпроси за беседа:", { bold: true }), ...numbered(plan.story.discussionQuestions));
  }
  if (plan.parentNote?.summaryMessage) {
    const n = plan.parentNote;
    out.push(h("За родителите"), p(n.summaryMessage), ...bullets(n.highlights ?? []));
    if (n.homeGameTitle) out.push(labeled(`Игра вкъщи по желание — „${n.homeGameTitle}“`, n.homeGameDescription));
  }
  return out;
}

function gameBody(game: GeneratedGame): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 120 }, children: [new TextRun({ text: game.title, font: FONT, color: "000000" })] }),
  ];
  if (game.subtitle) out.push(p(game.subtitle, { italics: true }));
  if (game.kit?.supplies?.length) out.push(h("Пригответе преди играта"), ...bullets(game.kit.supplies));
  if (game.rhymeLines.length) out.push(h("Стихче за начало"), ...game.rhymeLines.map((l) => p(l, { italics: true, after: 40 })));
  out.push(h("Ход на играта"), ...numbered(game.steps));
  if (game.tasks?.length) out.push(h("Образователни задачи (Наредба № 5)"), ...bullets(game.tasks.map(taskLine)));
  out.push(labeled(game.mode === "quick" ? "Полза от играта" : "Умения по Наредба № 5", game.pedagogicalGoal));
  if (game.sopAdaptation) out.push(labeled("Адаптация за дете със СОП", game.sopAdaptation));
  if (game.teacherTip) out.push(labeled("Съвет", game.teacherTip));
  const ws = game.kit?.worksheet;
  if (ws) {
    out.push(
      h(`Работен лист: ${ws.title}`),
      ...numbered(ws.tasks.map((t) => `${SHEET_KIND_LABELS[t.kind]} — ${t.prompt}`)),
      p("Картинките на листа се отпечатват от сайта („Печат на всичко“).", { italics: true }),
    );
  }
  if (game.kit?.cards?.cards.length) out.push(h("Карти за играта"), p(game.kit.cards.cards.map((c) => c.w).join(", ")));
  if (game.kit?.parentNote) {
    const n = game.kit.parentNote;
    out.push(h(n.title), ...n.paragraphs.map((x) => p(x)));
    if (n.homeIdea) out.push(labeled("Ако желаете — игра вкъщи", n.homeIdea));
  }
  return out;
}

function textBody(title: string, text: string): Paragraph[] {
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: title, font: FONT, color: "000000" })] }),
    ...text.split(/\r?\n/).map((line) => p(line, { after: line.trim() ? 80 : 160 })),
  ];
}

export async function buildDocx(input: DocxInput): Promise<Buffer> {
  const c = (input.content ?? {}) as Record<string, unknown>;
  let body: (Paragraph | Table)[];
  if (input.kind === "LESSON" && Array.isArray(c.stages)) body = lessonBody(c as unknown as GeneratedLessonPlan);
  else if (input.kind === "GAME" && Array.isArray(c.steps)) body = gameBody(c as unknown as GeneratedGame);
  else if (isPrintable(c.printable)) body = textBody(input.title, printableToText(c.printable));
  else body = textBody(input.title, typeof c.text === "string" ? c.text : "");

  const section: ISectionOptions = {
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    children: [...header(input), ...body],
  };
  const doc = new Document({
    creator: KG_SIGNATURE,
    title: input.title,
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: [section],
  });
  return Packer.toBuffer(doc);
}

/** Име на файла: заглавието, без забранени знаци. */
export function docxFileName(title: string): string {
  const clean = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "material";
  return `${clean}.docx`;
}

/** Годишното тематично разпределение като Word: хоризонтален A4 с таблица по седмици и ситуации. */
export async function buildPlanDocx(plan: import("@/services/thematicPlan").PlanView): Promise<Buffer> {
  const { DIRECTION_STANDARDS } = await import("@/services/naredba5");
  const dateBg = (ymd: string) => `${ymd.slice(8, 10)}.${ymd.slice(5, 7)}`;
  const rows: string[][] = [];
  for (const w of plan.weeks) {
    const head = `${w.week}. седмица\n${dateBg(w.startDate)} – ${dateBg(w.endDate)}${w.theme ? `\n„${w.theme}“` : ""}${w.holidays.length ? `\n${w.holidays.map((h) => h.name).join(", ")}` : ""}`;
    if (w.situations.length === 0) {
      rows.push([head, "", "", "", ""]);
      continue;
    }
    w.situations.forEach((s, i) => {
      rows.push([i === 0 ? head : "", DIRECTION_STANDARDS[s.direction].label, s.core, s.topic, s.results.join("\n")]);
    });
  }
  const section: ISectionOptions = {
    properties: { page: { size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 120 },
        children: [new TextRun({ text: KG_SIGNATURE, size: 20, color: "555555" })],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: `ТЕМАТИЧНО РАЗПРЕДЕЛЕНИЕ · учебна ${plan.schoolYear}/${plan.schoolYear + 1} г.`, font: FONT, color: "000000" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: `${plan.groupName || AGE_SHORT[plan.ageGroup]} · по Наредба № 5 за предучилищното образование` })],
      }),
      ...(plan.approvedAt
        ? [p(`Утвърдено от: ${plan.approvedByName ?? "директора"}, ${new Date(plan.approvedAt).toLocaleDateString("bg-BG")}`, { italics: true })]
        : [p("Утвърдил: ................................ (директор)", { after: 240 })]),
      table(["Седмица и тема", "Образователно направление", "Образователно ядро", "Тема на ситуацията", "Очаквани резултати"], rows, [18, 16, 16, 20, 30]),
    ],
  };
  const doc = new Document({
    creator: KG_SIGNATURE,
    title: `Тематично разпределение ${plan.schoolYear}/${plan.schoolYear + 1}`,
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [section],
  });
  return Packer.toBuffer(doc);
}
