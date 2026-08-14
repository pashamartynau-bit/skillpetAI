import { CourseChapterPageScreen } from "@/components/course-chapter-page-screen";

export default async function CourseChapterPage(
  props: PageProps<"/courses/[slug]/chapters/[chapterSlug]">,
) {
  const { chapterSlug, slug } = await props.params;
  return <CourseChapterPageScreen chapterSlug={chapterSlug} slug={slug} />;
}
