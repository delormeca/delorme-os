import React from "react";
import {
  Stack,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import { useCreateProject } from "@/hooks/api/useProjects";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowBack, Folder, Save } from "@mui/icons-material";
import {
  StandardButton,
  StandardIconButton,
  ModernCard,
  FormInput,
  FormSection,
  FeatureChip,
} from "@/components/ui";
import { useStandardForm, formSchemas } from "@/hooks";

interface ICreateProjectFormInputs {
  client_id: string;
  name: string;
  url: string;
  description?: string;
  sitemap_url?: string;
}

interface CreateProjectFormProps {
  defaultClientId?: string;
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ defaultClientId }) => {
  const navigate = useNavigate();
  const { clientId: paramClientId } = useParams<{ clientId: string }>();
  const theme = useTheme();
  const { mutateAsync: createProject } = useCreateProject();

  const clientId = defaultClientId || paramClientId || "";

  const form = useStandardForm<ICreateProjectFormInputs>({
    schema: formSchemas.project,
    onSuccess: async (data) => {
      await createProject(data);
      if (clientId) {
        navigate(`/clients/${clientId}`);
      } else {
        navigate("/projects");
      }
    },
    successMessage: "Project created successfully!",
    defaultValues: {
      client_id: clientId,
      name: "",
      url: "",
      description: "",
      sitemap_url: "",
    },
  });

  const handleCancel = () => {
    if (clientId) {
      navigate(`/clients/${clientId}`);
    } else {
      navigate("/clients");
    }
  };

  return (
    <Box sx={{ maxWidth: "md", mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <StandardIconButton
          variant="outlined"
          onClick={handleCancel}
        >
          <ArrowBack />
        </StandardIconButton>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, mb: 0.5 }}
          >
            Create New Project
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new project to crawl and manage pages
          </Typography>
        </Box>
        <FeatureChip
          icon={<Folder />}
          label="New Project"
          variant="outlined"
        />
      </Box>

      <ModernCard title="Project Details" icon={<Folder />} variant="glass">
        <form onSubmit={form.onSubmit}>
          <FormSection
            title="Basic Information"
            description="Enter the project details"
          >
            <FormInput
              name="name"
              control={form.control}
              errors={form.formState.errors}
              label="Project Name"
              placeholder="e.g., Main Website"
              fullWidth
              required
            />

            <FormInput
              name="url"
              control={form.control}
              errors={form.formState.errors}
              label="Website URL"
              placeholder="e.g., https://example.com"
              fullWidth
              required
            />

            <FormInput
              name="description"
              control={form.control}
              errors={form.formState.errors}
              label="Description"
              placeholder="Brief description of this project"
              multiline
              rows={3}
              fullWidth
            />

            <FormInput
              name="sitemap_url"
              control={form.control}
              errors={form.formState.errors}
              label="Sitemap URL (Optional)"
              placeholder="e.g., https://example.com/sitemap.xml"
              fullWidth
            />
          </FormSection>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <StandardButton
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleCancel}
            >
              Cancel
            </StandardButton>
            <StandardButton
              type="submit"
              variant="contained"
              startIcon={<Save />}
              isLoading={form.isSubmitting}
              loadingText="Creating Project..."
              sx={{ flex: 1 }}
            >
              Create Project
            </StandardButton>
          </Stack>
        </form>
      </ModernCard>
    </Box>
  );
};

export default CreateProjectForm;
