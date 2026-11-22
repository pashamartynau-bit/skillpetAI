import { fetchPublishedCourses, type CourseRecord } from "@/lib/strapi-courses";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = "grok-4.7";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2000;

export type GuideTurn = {
  role: "assistant" | "user";
  text: string;
};

export type GuideCourseCard = {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  href: string;
};

type CatalogCourse = GuideCourseCard & {
  estimatedMinutes: number | null;
};

type GrokGuideReply = {
  text: string;
  courseIds?: string[];
};

export async function askGrokGuide(messages: GuideTurn[]) {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing XAI_API_KEY.");
  }

  const catalog = await loadCatalog();
  const catalogById = new Map(catalog.map((course) => [course.id, course]));
  const model = process.env.XAI_MODEL?.trim() || DEFAULT_MODEL;
  const response = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(catalog) },
        ...messages.slice(-MAX_MESSAGES).map((message) => ({
          role: message.role,
          content: message.text.slice(0, MAX_MESSAGE_LENGTH),
        })),
      ],
    }),
  });

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Grok could not answer just now.");
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Grok returned an empty reply.");
  }

  const reply = parseGuideReply(content);
  const courses = (reply.courseIds ?? [])
    .map((courseId) => catalogById.get(courseId))
    .filter((course): course is CatalogCourse => Boolean(course))
    .slice(0, 3)
    .map(toGuideCourseCard);

  return {
    text: reply.text,
    courses,
  };
}

function toGuideCourseCard(course: CatalogCourse): GuideCourseCard {
  return {
    id: course.id,
    name: course.name,
    description: course.description,
    difficulty: course.difficulty,
    href: course.href,
  };
}

async function loadCatalog(): Promise<CatalogCourse[]> {
  try {
    const courses = await fetchPublishedCourses();
    return courses.slice(0, 40).map(toCatalogCourse);
  } catch (error) {
    console.error("Omni Guide could not load the course catalog:", error);
    return [];
  }
}

function toCatalogCourse(course: CourseRecord): CatalogCourse {
  return {
    id: course.id,
    name: course.name,
    description: course.description.slice(0, 280),
    difficulty: course.difficulty,
    href: course.href,
    estimatedMinutes: course.estimatedMinutes,
  };
}

function buildSystemPrompt(catalog: CatalogCourse[]) {
  return [
    "You are Omni Guide, the course assistant for Omni AI.",
    "Help the learner choose what to study. Be specific, warm, and brief.",
    "Recommend only courses from the catalog. Never invent a course.",
    "Reply with JSON only: {\"text\":\"...\",\"courseIds\":[\"...\"]}.",
    "courseIds must be catalog ids, at most 3, in the order you recommend them.",
    "If the catalog is empty or nothing fits, use an empty courseIds array and say so.",
    `Catalog: ${JSON.stringify(catalog)}`,
  ].join("\n");
}

function parseGuideReply(content: string): GrokGuideReply {
  try {
    const parsed = JSON.parse(content) as Partial<GrokGuideReply>;
    const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
    const courseIds = Array.isArray(parsed.courseIds)
      ? parsed.courseIds.filter((courseId): courseId is string => typeof courseId === "string")
      : [];

    if (text) {
      return { text, courseIds };
    }
  } catch {
    // Fall through to the raw reply when the model skips JSON.
  }

  return { text: content, courseIds: [] };
}

export function isGuideTurnList(value: unknown): value is GuideTurn[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return false;
  }

  return value.every(
    (message) =>
      typeof message === "object" &&
      message !== null &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.text === "string" &&
      message.text.trim().length > 0 &&
      message.text.length <= MAX_MESSAGE_LENGTH,
  );
}
