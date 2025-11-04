import React from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { EditArticleForm } from "@/components/Articles/EditArticleForm";

const EditArticle: React.FC = () => {
  return (
    <DashboardLayout>
      <EditArticleForm />
    </DashboardLayout>
  );
};

export default EditArticle;
