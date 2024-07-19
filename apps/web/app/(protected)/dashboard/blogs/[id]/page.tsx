import NiwiTextEditor from "@/components/niwi-blog/niwi-text-editor/niwi-text-editor";
import { getBlogById } from "@/feats/blog/services/blog.service";
import { notFound } from "next/navigation";

type BlogDetailPageProps = { params: { id: string } };

const BlogDetailPage = async ({ params: { id } }: BlogDetailPageProps) => {
  const { data, success } = await getBlogById(id);
  if (!success || !data) return notFound();

  return (
    <>
      <NiwiTextEditor initializeData={data.contentJson} />
    </>
  );
};
export default BlogDetailPage;
