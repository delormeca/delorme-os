import React, { useEffect } from "react";
import {
  Stack,
  Box,
  useTheme,
  Typography,
} from "@mui/material";
import { useUpdateClient, useClientDetail } from "@/hooks/api/useClients";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowBack, Edit, Save } from "@mui/icons-material";
import {
  StandardButton,
  StandardIconButton,
  ModernCard,
  FormInput,
  FormSection,
  FeatureChip,
  LoadingState,
} from "@/components/ui";
import { useStandardForm, formSchemas } from "@/hooks";

interface IEditClientFormInputs {
  name: string;
  industry?: string;
}

export const EditClientForm: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: client, isLoading: isLoadingClient } = useClientDetail(clientId || "");
  const { mutateAsync: updateClient } = useUpdateClient();

  const form = useStandardForm<IEditClientFormInputs>({
    schema: formSchemas.client,
    onSuccess: async (data) => {
      await updateClient({ clientId: clientId!, data });
      // Navigate back using slug
      if (client) {
        navigate(`/clients/${client.slug}`);
      } else {
        navigate(`/clients/${clientId}`);
      }
    },
    successMessage: "Client updated successfully!",
    defaultValues: {
      name: "",
      industry: "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        industry: client.industry || "",
      });
    }
  }, [client, form.reset]);

  if (isLoadingClient) {
    return <LoadingState message="Loading client..." />;
  }

  if (!client) {
    return (
      <Box sx={{ maxWidth: "md", mx: "auto", textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Client not found
        </Typography>
        <StandardButton
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/clients")}
          sx={{ mt: 2 }}
        >
          Back to Clients
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
            onClick={() => navigate(client?.slug ? `/clients/${client.slug}` : `/clients/${clientId}`)}
          >
            <ArrowBack />
          </StandardIconButton>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              Edit Client
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update client information
            </Typography>
          </Box>
          <FeatureChip icon={<Edit />} label="Edit Mode" variant="outlined" />
        </Box>

        <ModernCard title="Client Details" icon={<Edit />} variant="glass">
          <form onSubmit={form.onSubmit}>
            <FormSection
              title="Basic Information"
              description="Update the client's name and industry"
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
                onClick={() => navigate(client?.slug ? `/clients/${client.slug}` : `/clients/${clientId}`)}
              >
                Cancel
              </StandardButton>
              <StandardButton
                type="submit"
                variant="contained"
                startIcon={<Save />}
                isLoading={form.isSubmitting}
                loadingText="Updating Client..."
                sx={{ flex: 1 }}
              >
                Update Client
              </StandardButton>
            </Stack>
          </form>
        </ModernCard>
      </Box>
    </>
  );
};

export default EditClientForm;
