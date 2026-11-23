import { AI_COURSE_SOURCES } from "../lib/ai-courses";
import type { StrapiChapterContentBlock, StrapiCourse, StrapiCourseChapter } from "../lib/strapi-courses";

const projectId = process.env.SANITY_PROJECT_ID?.trim() || "njws1rbr";
const dataset = process.env.SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();

if (!token) {
  throw new Error("Missing SANITY_API_TOKEN.");
}

function sanityKey(value: string) {
  const key = value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  return key || "item";
}

function toSanityBlock(block: StrapiChapterContentBlock) {
  const { __component, id, ...fields } = block;

  return {
    _key: sanityKey(`block${id ?? "0"}`),
    _type: "object",
    blockType: __component,
    ...fields,
  };
}

function toSanityChapter(chapter: StrapiCourseChapter) {
  return {
    _key: sanityKey(chapter.documentId || chapter.slug || "chapter"),
    _type: "object",
    chapterNumber: chapter.chapterNumber,
    contentBlocks: (chapter.contentBlocks ?? []).map(toSanityBlock),
    description: chapter.description,
    emoji: chapter.emoji,
    name: chapter.name,
    slug: chapter.slug,
    sortOrder: chapter.sortOrder,
  };
}

function toSanityCourse(course: StrapiCourse) {
  return {
    _id: course.documentId,
    _type: "course",
    accessType: course.accessType,
    banner: course.banner,
    chapters: (course.chapters ?? []).map(toSanityChapter),
    difficultyLevel: course.difficultyLevel,
    estimatedMinutes: course.estimatedMinutes,
    isFeatured: course.isFeatured,
    isPublishedInApp: true,
    name: course.name,
    shortDescription: course.shortDescription,
    slug: course.slug,
    sortOrder: course.sortOrder,
  };
}

async function publishCourse(course: StrapiCourse) {
  const response = await fetch(
    `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mutations: [{ createOrReplace: toSanityCourse(course) }],
      }),
    },
  );

  const payload = (await response.json()) as { error?: { description?: string }; results?: unknown[] };

  if (!response.ok) {
    throw new Error(payload.error?.description || `Sanity rejected ${course.slug} with ${response.status}.`);
  }

  console.log(`published ${course.slug}`);
}

async function main() {
  for (const course of AI_COURSE_SOURCES) {
    await publishCourse(course);
  }
}

void main();
