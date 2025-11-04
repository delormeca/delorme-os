import DashboardLayout from "@/components/ui/DashboardLayout";
import { ArticlesList } from "@/components/Articles/ArticlesList";

export default function MyArticles() {
  return (
    <DashboardLayout>
      <ArticlesList />
    </DashboardLayout>
  );
}
