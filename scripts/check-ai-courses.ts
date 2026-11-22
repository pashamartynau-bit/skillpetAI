import { fetchPublishedCourseChapter, fetchPublishedCourses } from "../lib/strapi-courses";

async function main() {
  const courses = await fetchPublishedCourses();
  const problems: string[] = [];

  for (const course of courses) {
    if (!/ai|model|prompt|agent/i.test(`${course.name} ${course.description}`)) {
      problems.push(`off-topic ${course.slug}`);
    }

    for (const chapter of course.chapters) {
      const loaded = await fetchPublishedCourseChapter(course.slug, chapter.slug);
      if (!loaded) {
        problems.push(`missing ${course.slug}/${chapter.slug}`);
      }

      for (const block of chapter.contentBlocks) {
        if (block.malformed) {
          problems.push(`malformed ${course.slug}/${chapter.slug}/${block.title}`);
        }
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        courses: courses.map((course) => ({
          accessType: course.accessType,
          chapters: course.chapters.map((chapter) => ({
            blocks: chapter.contentBlocks.map((block) => block.type),
            name: chapter.name,
          })),
          difficulty: course.difficulty,
          name: course.name,
          slug: course.slug,
        })),
        problems,
      },
      null,
      2,
    ),
  );

  if (problems.length > 0) {
    process.exitCode = 1;
  }
}

void main();
