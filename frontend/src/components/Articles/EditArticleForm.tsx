import React, { useEffect } from "react";
import {
  Stack,
  Checkbox,
  FormControlLabel,
  Box,
  alpha,
  useTheme,
  Typography,
} from "@mui/material";
import { useUpdateArticle } from "@/hooks/api/useUpdateArticle";
import { useArticleDetail } from "@/hooks/api/useArticleDetail";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowBack, Edit, Save } from "@mui/icons-material";
import {
  StandardButton,
  StandardIconButton,
  ModernCard,
  FormInput,
  FormSection,
  FeatureChip,
  DashboardLayout,
  LoadingState,
} from "@/components/ui";
import { useStandardForm, formSchemas } from "@/hooks";

interface IEditArticleFormInputs {
  title: string;
  content: string;
  is_published?: boolean;
}

export const EditArticleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: article, isLoading: isLoadingArticle } = useArticleDetail(id);
  const { mutateAsync: updateArticle } = useUpdateArticle(id);

  const form = useStandardForm<IEditArticleFormInputs>({
    schema: formSchemas.article,
    onSuccess: async (data) => {
      await updateArticle(data);
      navigate("/dashboard/my-articles");
    },
    successMessage: "Article updated successfully!",
    defaultValues: {
      title: "",
      content: "",
      is_published: false,
    },
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        content: article.content,
        is_published: article.is_published,
      });
    }
  }, [article, form.reset]);

  if (isLoadingArticle) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading article..." />
      </DashboardLayout>
    );
  }

  if (!article) {
    return (
      <Box sx={{ maxWidth: "md", mx: "auto", textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Article not found
        </Typography>
        <StandardButton
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard/my-articles")}
          sx={{ mt: 2 }}
        >
          Back to Articles
        </StandardButton>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: "md", mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <StandardIconButton
            variant="outlined"
            onClick={() => navigate("/dashboard/my-articles")}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              Edit Article
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your article content and settings
            </Typography>
          </Box>
          <FeatureChip icon={<Edit />} label="Edit Mode" variant="outlined" />
        </Box>

        <ModernCard title="Article Details" icon={<Edit />} variant="glass">
          <form onSubmit={form.onSubmit}>
            <FormSection
              title="Content"
              description="Update your article title and content"
            >
              <FormInput
                name="title"
                control={form.control}
                errors={form.formState.errors}
                label="Article Title"
                placeholder="Enter a compelling title for your article"
                fullWidth
              />

              <FormInput
                name="content"
                control={form.control}
                errors={form.formState.errors}
                label="Content"
                placeholder="Write your article content here..."
                multiline
                rows={15}
                fullWidth
              />
            </FormSection>

            <FormSection
              title="Publishing Options"
              description="Choose when to make your article visible"
            >
              <Box
                sx={{
                  p: 2,
                  background: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      {...form.register("is_published")}
                      checked={form.watch("is_published")}
                    />
                  }
                  label={
                    <Box>
                      <Box component="span" sx={{ fontWeight: 500 }}>
                        Published
                      </Box>
                      <Box
                        component="div"
                        sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                      >
                        Make this article visible to everyone
                      </Box>
                    </Box>
                  }
                />
              </Box>
            </FormSection>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <StandardButton
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate("/dashboard/my-articles")}
              >
                Cancel
              </StandardButton>
              <StandardButton
                type="submit"
                variant="contained"
                startIcon={<Save />}
                isLoading={form.isSubmitting}
                loadingText="Updating Article..."
                sx={{ flex: 1 }}
              >
                Update Article
              </StandardButton>
            </Stack>
          </form>
        </ModernCard>
      </Box>
    </>
  );
};
