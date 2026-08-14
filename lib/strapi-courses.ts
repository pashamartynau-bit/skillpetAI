import { normalizeCourseAccessType, type CourseAccessType } from "@/lib/billing";

export type StrapiCourseMedia = {
  alternativeText?: string | null;
  height?: number | null;
  url?: string | null;
  width?: number | null;
};

export type StrapiCourse = {
  chapters?: StrapiCourseChapter[] | null;
  difficultyLevel?: string | null;
  documentId: string;
  estimatedMinutes?: number | null;
  id: number;
  isFeatured?: boolean | null;
  isPublishedInApp?: boolean | null;
  name?: string | null;
  shortDescription?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
  banner?: StrapiCourseMedia | null;
  accessType?: string | null;
};

export type StrapiCourseChapter = {
  chapterNumber?: number | null;
  contentBlocks?: StrapiChapterContentBlock[] | null;
  description?: string | null;
  documentId: string;
  id: number;
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
  emoji?: string | null;
};

export type StrapiChapterContentBlock =
  | StrapiTheoryBlock
  | StrapiMultipleChoiceBlock
  | StrapiFillInTheBlankBlock
  | StrapiTrueFalseBlock
  | StrapiYesNoBlock
  | StrapiMatchingBlock
  | StrapiCodeExerciseBlock
  | StrapiUnknownBlock;

type StrapiBaseContentBlock = {
  __component?: string | null;
  id?: number | null;
  title?: string | null;
};

type StrapiTheoryBlock = StrapiBaseContentBlock & {
  __component?: "learning.theory-block";
  bodyMarkdown?: string | null;
};

type StrapiMultipleChoiceBlock = StrapiBaseContentBlock & {
  __component?: "learning.multiple-choice-block";
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  question?: string | null;
  choices?: unknown;
  options?: unknown;
};

type StrapiFillInTheBlankBlock = StrapiBaseContentBlock & {
  __component?: "learning.fill-in-the-blank-block";
  acceptedAnswers?: unknown;
  answer?: string | null;
  answers?: unknown;
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  options?: unknown;
  prompt?: string | null;
};

type StrapiTrueFalseBlock = StrapiBaseContentBlock & {
  __component?: "learning.true-false-block";
  correctAnswer?: boolean | string | null;
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  statement?: string | null;
};

type StrapiYesNoBlock = StrapiBaseContentBlock & {
  __component?: "learning.yes-no-block";
  correctAnswer?: boolean | string | null;
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  question?: string | null;
};

type StrapiMatchingBlock = StrapiBaseContentBlock & {
  __component?: "learning.matching-block";
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  options?: unknown;
  pairs?: unknown;
  question?: string | null;
  scenario?: string | null;
};

type StrapiCodeExerciseBlock = StrapiBaseContentBlock & {
  __component?: "learning.code-exercise-block";
  codeLanguage?: string | null;
  codeSnippet?: string | null;
  expectedAnswer?: string | null;
  failureFeedback?: string | null;
  placeholderAnswer?: string | null;
  successFeedback?: string | null;
  taskPrompt?: string | null;
  theoryMarkdown?: string | null;
};

type StrapiUnknownBlock = StrapiBaseContentBlock & Record<string, unknown>;

type StrapiCoursesResponse = {
  data: StrapiCourse[];
};

export type CourseChapterRecord = {
  chapterNumber: number | null;
  contentBlocks: ChapterContentBlockRecord[];
  description: string;
  documentId: string;
  href: string;
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  emoji: string | null;
};

export type ChapterChoiceRecord = {
  explanation: string;
  id: string;
  isCorrect: boolean;
  text: string;
};

export type MatchingPairRecord = {
  id: string;
  left: string;
  right: string;
};

type BaseChapterContentBlockRecord = {
  id: string;
  malformed: boolean;
  title: string;
  type: string;
};

export type TheoryBlockRecord = BaseChapterContentBlockRecord & {
  bodyMarkdown: string;
  type: "theory";
};

export type MultipleChoiceBlockRecord = BaseChapterContentBlockRecord & {
  choices: ChapterChoiceRecord[];
  correctFeedback: string;
  incorrectFeedback: string;
  question: string;
  type: "multiple-choice";
};

export type FillInTheBlankBlockRecord = BaseChapterContentBlockRecord & {
  acceptedAnswers: string[];
  correctFeedback: string;
  incorrectFeedback: string;
  options: ChapterChoiceRecord[];
  prompt: string;
  type: "fill-in-the-blank";
};

export type TrueFalseBlockRecord = BaseChapterContentBlockRecord & {
  correctAnswer: boolean;
  correctFeedback: string;
  incorrectFeedback: string;
  statement: string;
  type: "true-false";
};

export type YesNoBlockRecord = BaseChapterContentBlockRecord & {
  correctAnswer: boolean;
  correctFeedback: string;
  incorrectFeedback: string;
  question: string;
  type: "yes-no";
};

export type MatchingBlockRecord = BaseChapterContentBlockRecord & {
  correctFeedback: string;
  incorrectFeedback: string;
  mode: "options" | "pairs";
  options: ChapterChoiceRecord[];
  pairs: MatchingPairRecord[];
  question: string;
  scenario: string;
  type: "matching";
};

export type CodeExerciseBlockRecord = BaseChapterContentBlockRecord & {
  codeLanguage: string;
  codeSnippet: string;
  expectedAnswer: string;
  failureFeedback: string;
  placeholderAnswer: string;
  successFeedback: string;
  taskPrompt: string;
  theoryMarkdown: string;
  type: "code-exercise";
};

export type UnsupportedBlockRecord = BaseChapterContentBlockRecord & {
  message: string;
  rawType: string;
  type: "unsupported";
};

export type ChapterContentBlockRecord =
  | TheoryBlockRecord
  | MultipleChoiceBlockRecord
  | FillInTheBlankBlockRecord
  | TrueFalseBlockRecord
  | YesNoBlockRecord
  | MatchingBlockRecord
  | CodeExerciseBlockRecord
  | UnsupportedBlockRecord;

export type CourseRecord = {
  accessType: CourseAccessType;
  bannerAlt: string;
  bannerHeight: number;
  bannerSrc: string;
  bannerWidth: number;
  chapters: CourseChapterRecord[];
  description: string;
  difficulty: string;
  documentId: string;
  estimatedMinutes: number | null;
  href: string;
  id: string;
  isFeatured: boolean;
  name: string;
  slug: string;
  sortOrder: number;
};

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

function getHeaders() {
  if (!STRAPI_API_TOKEN) {
    throw new Error("Missing STRAPI_API_TOKEN.");
  }

  return {
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function strapiFetch<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, STRAPI_BASE_URL), {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Strapi request failed with ${response.status}: ${errorText || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

function resolveMediaUrl(url: string | null | undefined) {
  if (!url) {
    return "/characters/Pip_1.png";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return new URL(url, STRAPI_BASE_URL).toString();
}

function normalizeCourse(course: StrapiCourse): CourseRecord | null {
  if (!course.name?.trim() || !course.slug?.trim()) {
    return null;
  }

  return {
    accessType: normalizeCourseAccessType(course.accessType),
    bannerAlt: course.banner?.alternativeText?.trim() || course.name.trim(),
    bannerHeight: course.banner?.height ?? 1254,
    bannerSrc: resolveMediaUrl(course.banner?.url),
    bannerWidth: course.banner?.width ?? 1254,
    chapters: normalizeChapters(course.chapters, course.slug.trim()),
    description: course.shortDescription?.trim() || "Start this AI course in SkillPet.",
    difficulty: course.difficultyLevel?.trim() || "Beginner",
    documentId: course.documentId,
    estimatedMinutes: typeof course.estimatedMinutes === "number" ? course.estimatedMinutes : null,
    href: `/courses/${encodeURIComponent(course.slug.trim())}`,
    id: course.documentId,
    isFeatured: Boolean(course.isFeatured),
    name: course.name.trim(),
    slug: course.slug.trim(),
    sortOrder: typeof course.sortOrder === "number" ? course.sortOrder : Number.MAX_SAFE_INTEGER,
  };
}

function normalizeChapters(chapters: StrapiCourse["chapters"], courseSlug: string) {
  if (!Array.isArray(chapters)) {
    return [] as CourseChapterRecord[];
  }

  return chapters
    .flatMap((chapter) => {
      if (!chapter.name?.trim() || !chapter.slug?.trim()) {
        return [];
      }

      return [
        {
          chapterNumber:
            typeof chapter.chapterNumber === "number" ? chapter.chapterNumber : null,
          contentBlocks: normalizeChapterContentBlocks(chapter.contentBlocks),
          description: chapter.description?.trim() || "Chapter content will be available soon.",
          documentId: chapter.documentId,
          href: `/courses/${encodeURIComponent(courseSlug)}/chapters/${encodeURIComponent(chapter.slug.trim())}`,
          id: chapter.documentId,
          name: chapter.name.trim(),
          slug: chapter.slug.trim(),
          sortOrder:
            typeof chapter.sortOrder === "number"
              ? chapter.sortOrder
              : typeof chapter.chapterNumber === "number"
                ? chapter.chapterNumber
                : Number.MAX_SAFE_INTEGER,
          emoji: chapter.emoji?.trim() || null,
        } satisfies CourseChapterRecord,
      ];
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function normalizeChapterContentBlocks(contentBlocks: StrapiCourseChapter["contentBlocks"]) {
  if (!Array.isArray(contentBlocks)) {
    return [] as ChapterContentBlockRecord[];
  }

  return contentBlocks.map(normalizeChapterContentBlock);
}

function normalizeChapterContentBlock(block: StrapiChapterContentBlock, index: number) {
  const blockType = block.__component?.trim() || "learning.unknown-block";
  const blockId = String(block.id ?? `${blockType}-${index}`);
  const title = block.title?.trim() || inferFallbackTitle(blockType, index);

  if (blockType === "learning.theory-block") {
    const theoryBlock = block as StrapiTheoryBlock;
    return {
      bodyMarkdown: theoryBlock.bodyMarkdown?.trim() || "",
      id: blockId,
      malformed: !(theoryBlock.bodyMarkdown?.trim()),
      title,
      type: "theory",
    } satisfies TheoryBlockRecord;
  }

  if (blockType === "learning.multiple-choice-block") {
    const choices = normalizeChoices((block as StrapiMultipleChoiceBlock).choices ?? (block as StrapiMultipleChoiceBlock).options);
    return {
      choices,
      correctFeedback: (block as StrapiMultipleChoiceBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as StrapiMultipleChoiceBlock).incorrectFeedback?.trim() || "Try again.",
      malformed:
        !((block as StrapiMultipleChoiceBlock).question?.trim()) ||
        choices.length === 0 ||
        !choices.some((choice) => choice.isCorrect),
      question: (block as StrapiMultipleChoiceBlock).question?.trim() || "",
      title,
      type: "multiple-choice",
    } satisfies MultipleChoiceBlockRecord;
  }

  if (blockType === "learning.fill-in-the-blank-block") {
    const options = normalizeChoices((block as StrapiFillInTheBlankBlock).options);
    const acceptedAnswers = normalizeStringAnswers(
      (block as StrapiFillInTheBlankBlock).acceptedAnswers ??
        extractCorrectOptionAnswers((block as StrapiFillInTheBlankBlock).options) ??
        (block as StrapiFillInTheBlankBlock).answers ??
        (block as StrapiFillInTheBlankBlock).answer,
    );
    return {
      acceptedAnswers,
      correctFeedback:
        (block as StrapiFillInTheBlankBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as StrapiFillInTheBlankBlock).incorrectFeedback?.trim() || "Try again.",
      malformed:
        !((block as StrapiFillInTheBlankBlock).prompt?.trim()) ||
        options.length === 0 ||
        !options.some((option) => option.isCorrect),
      options,
      prompt: (block as StrapiFillInTheBlankBlock).prompt?.trim() || "",
      title,
      type: "fill-in-the-blank",
    } satisfies FillInTheBlankBlockRecord;
  }

  if (blockType === "learning.true-false-block") {
    const correctAnswer = normalizeBooleanAnswer((block as StrapiTrueFalseBlock).correctAnswer);
    return {
      correctAnswer,
      correctFeedback:
        (block as StrapiTrueFalseBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as StrapiTrueFalseBlock).incorrectFeedback?.trim() || "Try again.",
      malformed: !((block as StrapiTrueFalseBlock).statement?.trim()),
      statement: (block as StrapiTrueFalseBlock).statement?.trim() || "",
      title,
      type: "true-false",
    } satisfies TrueFalseBlockRecord;
  }

  if (blockType === "learning.yes-no-block") {
    const correctAnswer = normalizeBooleanAnswer((block as StrapiYesNoBlock).correctAnswer);
    return {
      correctAnswer,
      correctFeedback:
        (block as StrapiYesNoBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as StrapiYesNoBlock).incorrectFeedback?.trim() || "Try again.",
      malformed: !((block as StrapiYesNoBlock).question?.trim()),
      question: (block as StrapiYesNoBlock).question?.trim() || "",
      title,
      type: "yes-no",
    } satisfies YesNoBlockRecord;
  }

  if (blockType === "learning.matching-block") {
    const options = normalizeChoices((block as StrapiMatchingBlock).options);
    const pairs = normalizeMatchingPairs((block as StrapiMatchingBlock).pairs);
    const mode = pairs.length > 0 ? "pairs" : options.length > 0 ? "options" : "pairs";
    return {
      correctFeedback:
        (block as StrapiMatchingBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as StrapiMatchingBlock).incorrectFeedback?.trim() || "Try again.",
      malformed:
        !((block as StrapiMatchingBlock).question?.trim()) ||
        (pairs.length === 0 && !options.some((option) => option.isCorrect)),
      mode,
      options,
      pairs,
      question: (block as StrapiMatchingBlock).question?.trim() || "",
      scenario: (block as StrapiMatchingBlock).scenario?.trim() || "",
      title,
      type: "matching",
    } satisfies MatchingBlockRecord;
  }

  if (blockType === "learning.code-exercise-block") {
    return {
      codeLanguage: (block as StrapiCodeExerciseBlock).codeLanguage?.trim() || "text",
      codeSnippet: (block as StrapiCodeExerciseBlock).codeSnippet?.trim() || "",
      expectedAnswer: (block as StrapiCodeExerciseBlock).expectedAnswer?.trim() || "",
      failureFeedback:
        (block as StrapiCodeExerciseBlock).failureFeedback?.trim() || "Try again.",
      id: blockId,
      malformed:
        !((block as StrapiCodeExerciseBlock).taskPrompt?.trim()) ||
        !((block as StrapiCodeExerciseBlock).expectedAnswer?.trim()),
      placeholderAnswer: (block as StrapiCodeExerciseBlock).placeholderAnswer?.trim() || "",
      successFeedback:
        (block as StrapiCodeExerciseBlock).successFeedback?.trim() || "Correct answer.",
      taskPrompt: (block as StrapiCodeExerciseBlock).taskPrompt?.trim() || "",
      theoryMarkdown: (block as StrapiCodeExerciseBlock).theoryMarkdown?.trim() || "",
      title,
      type: "code-exercise",
    } satisfies CodeExerciseBlockRecord;
  }

  return {
    id: blockId,
    malformed: true,
    message: "This content block is not supported yet.",
    rawType: blockType,
    title,
    type: "unsupported",
  } satisfies UnsupportedBlockRecord;
}

function inferFallbackTitle(blockType: string, index: number) {
  const normalizedType = blockType.replace("learning.", "").replaceAll("-", " ");
  return `${normalizedType.charAt(0).toUpperCase()}${normalizedType.slice(1)} ${index + 1}`;
}

function normalizeChoices(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ChapterChoiceRecord[];
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const text =
      readString(candidate.text) ||
      readString(candidate.label) ||
      readString(candidate.choiceText) ||
      readString(candidate.answerText);

    if (!text) {
      return [];
    }

    return [
      {
        explanation:
          readString(candidate.explanation) ||
          readString(candidate.feedback) ||
          readString(candidate.reason) ||
          "",
        id: String(candidate.id ?? `choice-${index}`),
        isCorrect:
          Boolean(candidate.isCorrect) ||
          Boolean(candidate.correct) ||
          Boolean(candidate.isAnswer),
        text,
      } satisfies ChapterChoiceRecord,
    ];
  });
}

function normalizeStringAnswers(value: unknown) {
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") {
      return item.trim() ? [item.trim()] : [];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const text =
      readString(candidate.text) ||
      readString(candidate.answer) ||
      readString(candidate.value);

    return text ? [text] : [];
  });
}

function extractCorrectOptionAnswers(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const answers = value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;

    if (
      !Boolean(candidate.isCorrect) &&
      !Boolean(candidate.correct) &&
      !Boolean(candidate.isAnswer)
    ) {
      return [];
    }

    const text =
      readString(candidate.value) ||
      readString(candidate.label) ||
      readString(candidate.text) ||
      readString(candidate.answer);

    return text ? [text] : [];
  });

  return answers.length > 0 ? answers : null;
}

function normalizeBooleanAnswer(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes";
}

function normalizeMatchingPairs(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as MatchingPairRecord[];
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const left =
      readString(candidate.left) ||
      readString(candidate.prompt) ||
      readString(candidate.term);
    const right =
      readString(candidate.right) ||
      readString(candidate.answer) ||
      readString(candidate.match);

    if (!left || !right) {
      return [];
    }

    return [
      {
        id: String(candidate.id ?? `pair-${index}`),
        left,
        right,
      } satisfies MatchingPairRecord,
    ];
  });
}

function readString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function buildBaseCourseParams() {
  const params = new URLSearchParams();
  params.set("status", "published");
  params.set("sort", "sortOrder:asc");
  params.set("filters[isPublishedInApp][$eq]", "true");
  params.set("populate[banner][fields][0]", "url");
  params.set("populate[banner][fields][1]", "alternativeText");
  params.set("populate[banner][fields][2]", "width");
  params.set("populate[banner][fields][3]", "height");
  return params;
}

export async function fetchPublishedCourses() {
  const params = buildBaseCourseParams();
  const response = await strapiFetch<StrapiCoursesResponse>(`/api/courses?${params.toString()}`);

  return response.data
    .map(normalizeCourse)
    .filter((course): course is CourseRecord => course !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export async function fetchPublishedCourseBySlug(slug: string) {
  const params = buildBaseCourseParams();
  params.set("filters[slug][$eq]", slug);
  params.set("populate[chapters][fields][0]", "name");
  params.set("populate[chapters][fields][1]", "description");
  params.set("populate[chapters][fields][2]", "slug");
  params.set("populate[chapters][fields][3]", "chapterNumber");
  params.set("populate[chapters][fields][4]", "sortOrder");
  params.set("populate[chapters][fields][5]", "emoji");
  params.set("populate[chapters][sort][0]", "sortOrder:asc");

  const response = await strapiFetch<StrapiCoursesResponse>(`/api/courses?${params.toString()}`);
  const course = response.data.map(normalizeCourse).find((value) => value !== null) ?? null;
  return course;
}

type StrapiChaptersResponse = {
  data: StrapiCourseChapter[];
};

export async function fetchPublishedCourseChapter(courseSlug: string, chapterSlug: string) {
  const course = await fetchPublishedCourseBySlug(courseSlug);

  if (!course) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("status", "published");
  params.set("filters[slug][$eq]", chapterSlug);
  params.set("populate[contentBlocks][populate]", "*");

  const response = await strapiFetch<StrapiChaptersResponse>(`/api/chapters?${params.toString()}`);
  const rawChapter = response.data.find((chapter) => chapter.slug?.trim() === chapterSlug) ?? null;

  if (!rawChapter) {
    return null;
  }

  const chapter = normalizeChapters([rawChapter], course.slug)[0] ?? null;

  if (!chapter) {
    return null;
  }

  const chapterIndex = course.chapters.findIndex((item) => item.slug === chapter.slug);

  if (chapterIndex < 0) {
    return null;
  }

  return {
    chapter,
    chapterIndex,
    course,
  };
}
