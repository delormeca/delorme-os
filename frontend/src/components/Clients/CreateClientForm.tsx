import React, { useState } from "react";
import {
  Stack,
  Box,
  Typography,
  useTheme,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useCreateClient } from "@/hooks/api/useClients";
import { useProjectLeads } from "@/hooks/api/useProjectLeads";
import { useNavigate } from "react-router-dom";
import { ArrowBack, Business, Save, CheckCircle, Error as ErrorIcon } from "@mui/icons-material";
import {
  StandardButton,
  StandardIconButton,
  ModernCard,
  FormInput,
  FormSection,
  FeatureChip,
  FormGrid,
} from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ClientCreate } from "@/client";
import { ClientsService } from "@/client";

const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  sitemap_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  logo_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  crawl_frequency: z.string().default('Manual Only'),
  status: z.string().default('Active'),
  project_lead_id: z.string().optional(),
});

type ICreateClientFormInputs = z.infer<typeof createClientSchema>;

const CRAWL_FREQUENCIES = [
  'Manual Only',
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
];

const STATUSES = [
  'Active',
  'Inactive',
  'Onboarding',
  'Paused',
];

export const CreateClientForm: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mutateAsync: createClient } = useCreateClient();
  const { data: projectLeads = [] } = useProjectLeads();
  const [sitemapTest, setSitemapTest] = useState<{
    testing: boolean;
    result?: { is_valid: boolean; url_count: number; error?: string };
  }>({ testing: false });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ICreateClientFormInputs>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      description: "",
      website_url: "",
      sitemap_url: "",
      industry: "",
      logo_url: "",
      crawl_frequency: "Manual Only",
      status: "Active",
      project_lead_id: "",
    },
  });

  const sitemapUrl = watch('sitemap_url');

  const handleTestSitemap = async () => {
    if (!sitemapUrl) return;

    setSitemapTest({ testing: true });
    try {
      const result = await ClientsService.testSitemapApiClientsTestSitemapPost({
        sitemap_url: sitemapUrl,
      });
      setSitemapTest({ testing: false, result });
    } catch (error) {
      setSitemapTest({ testing: false, result: { is_valid: false, url_count: 0, error: 'Test failed' } });
    }
  };

  const onSubmit = async (data: ICreateClientFormInputs) => {
    try {
      // Clean up empty strings - convert to undefined so they're not sent to API
      const cleanedData: any = {
        name: data.name,
        crawl_frequency: data.crawl_frequency,
        status: data.status,
      };

      // Only include optional fields if they have values
      if (data.description) cleanedData.description = data.description;
      if (data.website_url) cleanedData.website_url = data.website_url;
      if (data.sitemap_url) cleanedData.sitemap_url = data.sitemap_url;
      if (data.industry) cleanedData.industry = data.industry;
      if (data.logo_url) cleanedData.logo_url = data.logo_url;
      if (data.project_lead_id) cleanedData.project_lead_id = data.project_lead_id;

      await createClient(cleanedData as ClientCreate);
      navigate("/clients");
    } catch (error) {
      // Error handled by hook
    }
  };

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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={4}>
            {/* Basic Information */}
            <FormSection
              title="Basic Information"
              description="Enter the client's name and basic details"
            >
              <FormGrid columns={2}>
                <FormInput
                  name="name"
                  control={control}
                  errors={errors}
                  label="Client Name"
                  placeholder="e.g., Acme Corporation"
                  required
                />

                <FormInput
                  name="industry"
                  control={control}
                  errors={errors}
                  label="Industry"
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </FormGrid>

              <FormInput
                name="description"
                control={control}
                errors={errors}
                label="Description"
                placeholder="Brief description of the client..."
                multiline
                rows={3}
              />
            </FormSection>

            {/* Website & Sitemap */}
            <FormSection
              title="Website Information"
              description="Provide website and sitemap URLs for crawling"
            >
              <FormGrid columns={2}>
                <FormInput
                  name="website_url"
                  control={control}
                  errors={errors}
                  label="Website URL"
                  placeholder="https://example.com"
                />

                <FormInput
                  name="sitemap_url"
                  control={control}
                  errors={errors}
                  label="Sitemap URL"
                  placeholder="https://example.com/sitemap.xml"
                />
              </FormGrid>

              {sitemapUrl && (
                <Box>
                  <StandardButton
                    variant="outlined"
                    size="small"
                    onClick={handleTestSitemap}
                    isLoading={sitemapTest.testing}
                    loadingText="Testing..."
                    disabled={!sitemapUrl}
                  >
                    Test Sitemap
                  </StandardButton>
                  {sitemapTest.result && (
                    <Alert
                      severity={sitemapTest.result.is_valid ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                      icon={sitemapTest.result.is_valid ? <CheckCircle /> : <ErrorIcon />}
                    >
                      {sitemapTest.result.is_valid ? (
                        <>
                          Sitemap is valid! Found {sitemapTest.result.url_count} URLs.
                        </>
                      ) : (
                        <>
                          {sitemapTest.result.error || 'Invalid sitemap URL'}
                        </>
                      )}
                    </Alert>
                  )}
                </Box>
              )}
            </FormSection>

            {/* Branding */}
            <FormSection
              title="Branding"
              description="Add client logo and visual identity"
            >
              <FormInput
                name="logo_url"
                control={control}
                errors={errors}
                label="Logo URL"
                placeholder="https://example.com/logo.png"
                helperText="Provide a URL to the client's logo image"
              />
            </FormSection>

            {/* Management */}
            <FormSection
              title="Management Settings"
              description="Configure crawl frequency and project lead assignment"
            >
              <FormGrid columns={2}>
                <FormInput
                  name="crawl_frequency"
                  control={control}
                  errors={errors}
                  label="Crawl Frequency"
                  select
                  required
                >
                  {CRAWL_FREQUENCIES.map((freq) => (
                    <MenuItem key={freq} value={freq}>
                      {freq}
                    </MenuItem>
                  ))}
                </FormInput>

                <FormInput
                  name="status"
                  control={control}
                  errors={errors}
                  label="Status"
                  select
                  required
                >
                  {STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </FormInput>
              </FormGrid>

              <FormInput
                name="project_lead_id"
                control={control}
                errors={errors}
                label="Project Lead"
                select
                helperText="Assign a project lead to this client"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {projectLeads.map((lead) => (
                  <MenuItem key={lead.id} value={lead.id}>
                    {lead.name} ({lead.email})
                  </MenuItem>
                ))}
              </FormInput>
            </FormSection>

            {/* Actions */}
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
                isLoading={isSubmitting}
                loadingText="Creating Client..."
                sx={{ flex: 1 }}
              >
                Create Client
              </StandardButton>
            </Stack>
          </Stack>
        </form>
      </ModernCard>
    </Box>
  );
};

export default CreateClientForm;
