import { normalizeCourseAccessType, type CourseAccessType } from "@/lib/billing";
import { getSanityClient } from "@/lib/sanity";

export type CmsCourseMedia = {
  alternativeText?: string | null;
  height?: number | null;
  url?: string | null;
  width?: number | null;
};

export type CmsCourse = {
  chapters?: CmsCourseChapter[] | null;
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
  banner?: CmsCourseMedia | null;
  accessType?: string | null;
};

export type CmsCourseChapter = {
  chapterNumber?: number | null;
  contentBlocks?: CmsChapterContentBlock[] | null;
  description?: string | null;
  documentId: string;
  id: number;
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
  emoji?: string | null;
};

export type CmsChapterContentBlock =
  | CmsTheoryBlock
  | CmsMultipleChoiceBlock
  | CmsFillInTheBlankBlock
  | CmsTrueFalseBlock
  | CmsYesNoBlock
  | CmsMatchingBlock
  | CmsCodeExerciseBlock
  | CmsUnknownBlock;

type CmsBaseContentBlock = {
  __component?: string | null;
  id?: string | number | null;
  title?: string | null;
};

type CmsTheoryBlock = CmsBaseContentBlock & {
  __component?: "learning.theory-block";
  bodyMarkdown?: string | null;
};

type CmsMultipleChoiceBlock = CmsBaseContentBlock & {
  __component?: "learning.multiple-choice-block";
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  question?: string | null;
  choices?: unknown;
  options?: unknown;
};

type CmsFillInTheBlankBlock = CmsBaseContentBlock & {
  __component?: "learning.fill-in-the-blank-block";
  acceptedAnswers?: unknown;
  answer?: string | null;
  answers?: unknown;
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  options?: unknown;
  prompt?: string | null;
};

type CmsTrueFalseBlock = CmsBaseContentBlock & {
  __component?: "learning.true-false-block";
  correctAnswer?: boolean | string | null;
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  statement?: string | null;
};

type CmsYesNoBlock = CmsBaseContentBlock & {
  __component?: "learning.yes-no-block";
  correctAnswer?: boolean | string | null;
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  question?: string | null;
};

type CmsMatchingBlock = CmsBaseContentBlock & {
  __component?: "learning.matching-block";
  correctFeedback?: string | null;
  incorrectFeedback?: string | null;
  options?: unknown;
  pairs?: unknown;
  question?: string | null;
  scenario?: string | null;
};

type CmsCodeExerciseBlock = CmsBaseContentBlock & {
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

type CmsUnknownBlock = CmsBaseContentBlock & Record<string, unknown>;

type CmsCoursesResponse = {
  data: CmsCourse[];
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

function resolveMediaUrl(url: string | null | undefined) {
  if (!url) {
    return "/characters/Pip_1.png";
  }

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }

  return `/${url}`;
}

function normalizeCourse(course: CmsCourse): CourseRecord | null {
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
    description: course.shortDescription?.trim() || "Start this AI course with Omni AI.",
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

function normalizeChapters(chapters: CmsCourse["chapters"], courseSlug: string) {
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

function normalizeChapterContentBlocks(contentBlocks: CmsCourseChapter["contentBlocks"]) {
  if (!Array.isArray(contentBlocks)) {
    return [] as ChapterContentBlockRecord[];
  }

  return contentBlocks.map(normalizeChapterContentBlock);
}

function normalizeChapterContentBlock(block: CmsChapterContentBlock, index: number) {
  const blockType = block.__component?.trim() || "learning.unknown-block";
  const blockId = String(block.id ?? `${blockType}-${index}`);
  const title = block.title?.trim() || inferFallbackTitle(blockType, index);

  if (blockType === "learning.theory-block") {
    const theoryBlock = block as CmsTheoryBlock;
    return {
      bodyMarkdown: theoryBlock.bodyMarkdown?.trim() || "",
      id: blockId,
      malformed: !(theoryBlock.bodyMarkdown?.trim()),
      title,
      type: "theory",
    } satisfies TheoryBlockRecord;
  }

  if (blockType === "learning.multiple-choice-block") {
    const choices = normalizeChoices((block as CmsMultipleChoiceBlock).choices ?? (block as CmsMultipleChoiceBlock).options);
    return {
      choices,
      correctFeedback: (block as CmsMultipleChoiceBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as CmsMultipleChoiceBlock).incorrectFeedback?.trim() || "Try again.",
      malformed:
        !((block as CmsMultipleChoiceBlock).question?.trim()) ||
        choices.length === 0 ||
        !choices.some((choice) => choice.isCorrect),
      question: (block as CmsMultipleChoiceBlock).question?.trim() || "",
      title,
      type: "multiple-choice",
    } satisfies MultipleChoiceBlockRecord;
  }

  if (blockType === "learning.fill-in-the-blank-block") {
    const options = normalizeChoices((block as CmsFillInTheBlankBlock).options);
    const acceptedAnswers = normalizeStringAnswers(
      (block as CmsFillInTheBlankBlock).acceptedAnswers ??
        extractCorrectOptionAnswers((block as CmsFillInTheBlankBlock).options) ??
        (block as CmsFillInTheBlankBlock).answers ??
        (block as CmsFillInTheBlankBlock).answer,
    );
    return {
      acceptedAnswers,
      correctFeedback:
        (block as CmsFillInTheBlankBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as CmsFillInTheBlankBlock).incorrectFeedback?.trim() || "Try again.",
      malformed:
        !((block as CmsFillInTheBlankBlock).prompt?.trim()) ||
        options.length === 0 ||
        !options.some((option) => option.isCorrect),
      options,
      prompt: (block as CmsFillInTheBlankBlock).prompt?.trim() || "",
      title,
      type: "fill-in-the-blank",
    } satisfies FillInTheBlankBlockRecord;
  }

  if (blockType === "learning.true-false-block") {
    const correctAnswer = normalizeBooleanAnswer((block as CmsTrueFalseBlock).correctAnswer);
    return {
      correctAnswer,
      correctFeedback:
        (block as CmsTrueFalseBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as CmsTrueFalseBlock).incorrectFeedback?.trim() || "Try again.",
      malformed: !((block as CmsTrueFalseBlock).statement?.trim()),
      statement: (block as CmsTrueFalseBlock).statement?.trim() || "",
      title,
      type: "true-false",
    } satisfies TrueFalseBlockRecord;
  }

  if (blockType === "learning.yes-no-block") {
    const correctAnswer = normalizeBooleanAnswer((block as CmsYesNoBlock).correctAnswer);
    return {
      correctAnswer,
      correctFeedback:
        (block as CmsYesNoBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as CmsYesNoBlock).incorrectFeedback?.trim() || "Try again.",
      malformed: !((block as CmsYesNoBlock).question?.trim()),
      question: (block as CmsYesNoBlock).question?.trim() || "",
      title,
      type: "yes-no",
    } satisfies YesNoBlockRecord;
  }

  if (blockType === "learning.matching-block") {
    const options = normalizeChoices((block as CmsMatchingBlock).options);
    const pairs = normalizeMatchingPairs((block as CmsMatchingBlock).pairs);
    const mode = pairs.length > 0 ? "pairs" : options.length > 0 ? "options" : "pairs";
    return {
      correctFeedback:
        (block as CmsMatchingBlock).correctFeedback?.trim() || "Correct answer.",
      id: blockId,
      incorrectFeedback:
        (block as CmsMatchingBlock).incorrectFeedback?.trim() || "Try again.",
      malformed:
        !((block as CmsMatchingBlock).question?.trim()) ||
        (pairs.length === 0 && !options.some((option) => option.isCorrect)),
      mode,
      options,
      pairs,
      question: (block as CmsMatchingBlock).question?.trim() || "",
      scenario: (block as CmsMatchingBlock).scenario?.trim() || "",
      title,
      type: "matching",
    } satisfies MatchingBlockRecord;
  }

  if (blockType === "learning.code-exercise-block") {
    return {
      codeLanguage: (block as CmsCodeExerciseBlock).codeLanguage?.trim() || "text",
      codeSnippet: (block as CmsCodeExerciseBlock).codeSnippet?.trim() || "",
      expectedAnswer: (block as CmsCodeExerciseBlock).expectedAnswer?.trim() || "",
      failureFeedback:
        (block as CmsCodeExerciseBlock).failureFeedback?.trim() || "Try again.",
      id: blockId,
      malformed:
        !((block as CmsCodeExerciseBlock).taskPrompt?.trim()) ||
        !((block as CmsCodeExerciseBlock).expectedAnswer?.trim()),
      placeholderAnswer: (block as CmsCodeExerciseBlock).placeholderAnswer?.trim() || "",
      successFeedback:
        (block as CmsCodeExerciseBlock).successFeedback?.trim() || "Correct answer.",
      taskPrompt: (block as CmsCodeExerciseBlock).taskPrompt?.trim() || "",
      theoryMarkdown: (block as CmsCodeExerciseBlock).theoryMarkdown?.trim() || "",
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


type SanityBanner = {
  alternativeText?: string | null;
  height?: number | null;
  url?: string | null;
  width?: number | null;
};

type SanityContentBlock = {
  _key?: string;
  _type?: string;
  blockType?: string | null;
} & Record<string, unknown>;

type SanityChapter = {
  _key?: string;
  chapterNumber?: number | null;
  contentBlocks?: SanityContentBlock[] | null;
  description?: string | null;
  emoji?: string | null;
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
};

type SanityCourse = {
  _id: string;
  accessType?: string | null;
  banner?: SanityBanner | null;
  chapters?: SanityChapter[] | null;
  difficultyLevel?: string | null;
  estimatedMinutes?: number | null;
  isFeatured?: boolean | null;
  name?: string | null;
  shortDescription?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
};

const publishedCourseFilter = `_type == "course" && isPublishedInApp == true && !(_id in path("drafts.**"))`;

const courseProjection = `{
  _id,
  accessType,
  banner,
  chapters[]{
    _key,
    chapterNumber,
    contentBlocks,
    description,
    emoji,
    name,
    slug,
    sortOrder
  },
  difficultyLevel,
  estimatedMinutes,
  isFeatured,
  name,
  shortDescription,
  slug,
  sortOrder
}`;

function toContentBlock(block: SanityContentBlock, index: number): CmsChapterContentBlock {
  const blockType = block.blockType?.trim() || block._type?.trim() || "learning.unknown-block";

  return {
    ...block,
    __component: blockType,
    id: block._key ?? `${blockType}-${index}`,
  };
}

function toCourseSource(course: SanityCourse): CmsCourse {
  return {
    accessType: course.accessType,
    banner: course.banner
      ? {
          alternativeText: course.banner.alternativeText,
          height: course.banner.height,
          url: course.banner.url,
          width: course.banner.width,
        }
      : null,
    chapters: (course.chapters ?? []).map((chapter, index) => ({
      chapterNumber: chapter.chapterNumber,
      contentBlocks: (chapter.contentBlocks ?? []).map(toContentBlock),
      description: chapter.description,
      documentId: chapter._key ?? `${course._id}-chapter-${index}`,
      emoji: chapter.emoji,
      id: index,
      name: chapter.name,
      slug: chapter.slug,
      sortOrder: chapter.sortOrder,
    })),
    difficultyLevel: course.difficultyLevel,
    documentId: course._id,
    estimatedMinutes: course.estimatedMinutes,
    id: 0,
    isFeatured: course.isFeatured,
    isPublishedInApp: true,
    name: course.name,
    shortDescription: course.shortDescription,
    slug: course.slug,
    sortOrder: course.sortOrder,
  };
}

function normalizeSanityCourse(course: SanityCourse) {
  return normalizeCourse(toCourseSource(course));
}

export async function fetchPublishedCourses() {
  const courses = await getSanityClient().fetch<SanityCourse[]>(
    `*[${publishedCourseFilter}] | order(sortOrder asc) ${courseProjection}`,
  );

  return courses
    .map(normalizeSanityCourse)
    .filter((course): course is CourseRecord => course !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export async function fetchPublishedCourseBySlug(slug: string) {
  const course = await getSanityClient().fetch<SanityCourse | null>(
    `*[${publishedCourseFilter} && slug == $slug][0] ${courseProjection}`,
    { slug },
  );

  return course ? normalizeSanityCourse(course) : null;
}

export async function fetchPublishedCourseChapter(courseSlug: string, chapterSlug: string) {
  const course = await fetchPublishedCourseBySlug(courseSlug);

  if (!course) {
    return null;
  }

  const chapterIndex = course.chapters.findIndex((chapter) => chapter.slug === chapterSlug);
  const chapter = course.chapters[chapterIndex];

  if (!chapter) {
    return null;
  }

  return {
    chapter,
    chapterIndex,
    course,
  };
}
