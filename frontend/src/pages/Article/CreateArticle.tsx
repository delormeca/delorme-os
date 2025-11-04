import React from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CreateArticleForm } from "@/components/Articles/CreateArticleForm";

const CreateArticle: React.FC = () => {
  return (
    <DashboardLayout>
      <CreateArticleForm />
    </DashboardLayout>
  );
};

export default CreateArticle;
