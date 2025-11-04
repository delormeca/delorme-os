import React from "react";
import {
  Stack,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useCreateArticle } from "@/hooks/api/useCreateArticle";
import { useNavigate } from "react-router-dom";
import { ArrowBack, Article, Save } from "@mui/icons-material";
import {
  StandardButton,
  StandardIconButton,
  ModernCard,
  FormInput,
  FormSection,
  FeatureChip,
  DashboardLayout,
} from "@/components/ui";
import { useStandardForm, formSchemas } from "@/hooks";

interface ICreateArticleFormInputs {
  title: string;
  content: string;
  is_published?: boolean;
}

export const CreateArticleForm: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mutateAsync: createArticle } = useCreateArticle();

  const form = useStandardForm<ICreateArticleFormInputs>({
    schema: formSchemas.article,
    onSuccess: async (data) => {
      await createArticle(data);
      navigate("/dashboard/my-articles");
    },
    successMessage: "Article created successfully!",
    defaultValues: {
      title: "",
      content: "",
      is_published: false,
    },
  });

  return (
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
            Create New Article
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Write and publish your new article
          </Typography>
        </Box>
        <FeatureChip
          icon={<Article />}
          label="New Article"
          variant="outlined"
        />
      </Box>

      <ModernCard title="Article Details" icon={<Article />} variant="glass">
        <form onSubmit={form.onSubmit}>
          <FormSection
            title="Content"
            description="Add your article title and content"
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
              rows={10}
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
                      Publish immediately
                    </Box>
                    <Box
                      component="div"
                      sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                    >
                      Make this article visible to everyone right away
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
              loadingText="Creating Article..."
              sx={{ flex: 1 }}
            >
              Create Article
            </StandardButton>
          </Stack>
        </form>
      </ModernCard>
    </Box>
  );
};
