import React from "react";
import {
  Stack,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import { useCreateClient } from "@/hooks/api/useClients";
import { useNavigate } from "react-router-dom";
import { ArrowBack, Business, Save } from "@mui/icons-material";
import {
  StandardButton,
  StandardIconButton,
  ModernCard,
  FormInput,
  FormSection,
  FeatureChip,
} from "@/components/ui";
import { useStandardForm, formSchemas } from "@/hooks";

interface ICreateClientFormInputs {
  name: string;
  industry?: string;
}

export const CreateClientForm: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mutateAsync: createClient } = useCreateClient();

  const form = useStandardForm<ICreateClientFormInputs>({
    schema: formSchemas.client,
    onSuccess: async (data) => {
      await createClient(data);
      navigate("/clients");
    },
    successMessage: "Client created successfully!",
    defaultValues: {
      name: "",
      industry: "",
    },
  });

  return (
    <Box sx={{ maxWidth: "md", mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <StandardIconButton
          variant="outlined"
          onClick={() => navigate("/clients")}
        >
          <ArrowBack />
        </StandardIconButton>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, mb: 0.5 }}
          >
            Create New Client
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new client to organize your projects
          </Typography>
        </Box>
        <FeatureChip
          icon={<Business />}
          label="New Client"
          variant="outlined"
        />
      </Box>

      <ModernCard title="Client Details" icon={<Business />} variant="glass">
        <form onSubmit={form.onSubmit}>
          <FormSection
            title="Basic Information"
            description="Enter the client's name and industry"
          >
            <FormInput
              name="name"
              control={form.control}
              errors={form.formState.errors}
              label="Client Name"
              placeholder="e.g., Acme Corporation"
              fullWidth
              required
            />

            <FormInput
              name="industry"
              control={form.control}
              errors={form.formState.errors}
              label="Industry"
              placeholder="e.g., Technology, Healthcare, Finance"
              fullWidth
            />
          </FormSection>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <StandardButton
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/clients")}
            >
              Cancel
            </StandardButton>
            <StandardButton
              type="submit"
              variant="contained"
              startIcon={<Save />}
              isLoading={form.isSubmitting}
              loadingText="Creating Client..."
              sx={{ flex: 1 }}
            >
              Create Client
            </StandardButton>
          </Stack>
        </form>
      </ModernCard>
    </Box>
  );
};

export default CreateClientForm;
