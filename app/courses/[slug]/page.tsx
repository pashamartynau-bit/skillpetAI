import { CoursePageScreen } from "@/components/course-page-screen";

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  return <CoursePageScreen slug={slug} />;
}
