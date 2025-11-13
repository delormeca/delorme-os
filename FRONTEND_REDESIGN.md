# Frontend Redesign - Remove Projects, Add Engine & Workflows

**Date**: 2025-11-12
**Status**: 🎨 Frontend Implementation Plan
**Goal**: Implement new client-centric UI with Engine box and Workflows toggle

---

## Table of Contents

1. [Current Frontend Structure](#current-frontend-structure)
2. [Changes Required](#changes-required)
3. [New Pages to Create](#new-pages-to-create)
4. [Pages to Delete](#pages-to-delete)
5. [Components to Create](#components-to-create)
6. [Routing Changes](#routing-changes)
7. [API Hooks](#api-hooks)
8. [Implementation Checklist](#implementation-checklist)

---

## Current Frontend Structure

### Existing Stack

```json
{
  "framework": "React 18",
  "language": "TypeScript",
  "ui": "Material-UI v6",
  "routing": "React Router v6",
  "state": "TanStack React Query v5",
  "forms": "React Hook Form + Yup",
  "build": "Vite"
}
```

### Current Pages

```
frontend/src/pages/
├── Clients/
│   ├── MyClients.tsx          ← Keep
│   ├── CreateClient.tsx       ← Keep
│   ├── EditClient.tsx         ← Keep
│   └── ClientDetail.tsx       ← REDESIGN (remove projects, add engine/workflows)
│
├── Projects/                  ← DELETE ENTIRE FOLDER
│   ├── CreateProject.tsx
│   ├── EditProject.tsx
│   ├── ProjectDetail.tsx
│   └── ProjectCrawling.tsx
│
├── Dashboard.tsx
├── Analytics.tsx
├── Billing.tsx
└── ... (other pages)
```

### Current Routes (from App.tsx lines 51-54)

```tsx
import CreateProject from "./pages/Projects/CreateProject";
import EditProject from "./pages/Projects/EditProject";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import ProjectCrawling from "./pages/Projects/ProjectCrawling";
```

---

## Changes Required

### 1. Delete Project Pages ❌

**Files to delete:**
```
frontend/src/pages/Projects/CreateProject.tsx
frontend/src/pages/Projects/EditProject.tsx
frontend/src/pages/Projects/ProjectDetail.tsx
frontend/src/pages/Projects/ProjectCrawling.tsx
frontend/src/pages/Projects/ (entire folder)
```

### 2. Update App.tsx Routing 🔄

**Remove these imports (lines 51-54):**
```tsx
import CreateProject from "./pages/Projects/CreateProject";
import EditProject from "./pages/Projects/EditProject";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import ProjectCrawling from "./pages/Projects/ProjectCrawling";
```

**Remove these routes:**
```tsx
{/* OLD - DELETE THESE */}
<Route path="/projects/create/:clientId" element={<CreateProject />} />
<Route path="/projects/:projectId/edit" element={<EditProject />} />
<Route path="/projects/:projectId" element={<ProjectDetail />} />
<Route path="/projects/:projectId/crawl" element={<ProjectCrawling />} />
```

**Add new routes:**
```tsx
{/* NEW - ADD THESE */}
<Route path="/clients/:clientSlug" element={<ClientProfilePage />} />
<Route path="/clients/:clientSlug/engine" element={<EngineDetailPage />} />
<Route path="/clients/:clientSlug/:workflowSlug" element={<WorkflowPage />} />
```

### 3. Redesign ClientDetail.tsx → ClientProfilePage.tsx 🎨

**Current ClientDetail.tsx** shows:
- Client info
- Tabs: Projects | Pages | Settings
- Project list (to be removed)

**New ClientProfilePage.tsx** shows:
- Client header (name, logo, metadata)
- Engine box (crawl status, actions)
- Workflows & Apps toggle (expandable workflow cards)

---

## New Pages to Create

### 1. ClientProfilePage.tsx

**Path:** `frontend/src/pages/Clients/ClientProfilePage.tsx`

**Purpose:** Main client profile view with Engine + Workflows

**Key Features:**
- Client header with breadcrumb
- Engine status box
- Workflows & Apps expandable section
- Responsive grid layout

**Code Structure:**
```tsx
// frontend/src/pages/Clients/ClientProfilePage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Breadcrumbs, Link, Typography } from '@mui/material';
import { useClientBySlug } from '@/hooks/api/useClients';
import ClientProfileHeader from '@/components/client/ClientProfileHeader';
import EngineBox from '@/components/client/EngineBox';
import WorkflowsAppsToggle from '@/components/client/WorkflowsAppsToggle';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NotFound from '@/pages/NotFound';

const ClientProfilePage: React.FC = () => {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const navigate = useNavigate();
  const [workflowsExpanded, setWorkflowsExpanded] = useState(true);

  const { data: clientData, isLoading, error } = useClientBySlug(clientSlug!);

  if (isLoading) return <LoadingSpinner />;
  if (error || !clientData) return <NotFound />;

  const { client, engine_status, workflows, recent_executions } = clientData;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            onClick={() => navigate('/clients')}
            sx={{ cursor: 'pointer' }}
          >
            Clients
          </Link>
          <Typography color="text.primary">{client.name}</Typography>
        </Breadcrumbs>

        {/* Client Header */}
        <ClientProfileHeader
          client={client}
          onEdit={() => navigate(`/clients/${clientSlug}/edit`)}
          onDelete={() => {/* handle delete */}}
        />

        {/* Engine Box */}
        <Box sx={{ mt: 4 }}>
          <EngineBox
            client={client}
            engineStatus={engine_status}
            onStartExtraction={() => {/* trigger extraction */}}
            onViewPages={() => navigate(`/clients/${clientSlug}/engine/pages`)}
            onRerunSetup={() => {/* trigger setup */}}
          />
        </Box>

        {/* Workflows & Apps */}
        <Box sx={{ mt: 4 }}>
          <WorkflowsAppsToggle
            client={client}
            workflows={workflows}
            recentExecutions={recent_executions}
            expanded={workflowsExpanded}
            onToggle={() => setWorkflowsExpanded(!workflowsExpanded)}
            onLaunchWorkflow={(slug) => navigate(`/clients/${clientSlug}/${slug}`)}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default ClientProfilePage;
```

---

### 2. EngineDetailPage.tsx

**Path:** `frontend/src/pages/Clients/EngineDetailPage.tsx`

**Purpose:** Detailed view of engine status and all pages

**Key Features:**
- Full engine statistics
- Crawl history timeline
- All discovered pages in table
- Export options

**Route:** `/clients/:clientSlug/engine`

---

### 3. WorkflowPage.tsx

**Path:** `frontend/src/pages/Workflows/WorkflowPage.tsx`

**Purpose:** Individual workflow page (generic for all workflows)

**Key Features:**
- Workflow header with breadcrumb
- Configuration panel
- Trigger button
- Execution history
- Output display (PDF, JSON, dashboard)

**Route:** `/clients/:clientSlug/:workflowSlug`

**Code Structure:**
```tsx
// frontend/src/pages/Workflows/WorkflowPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Breadcrumbs,
  Link,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { useWorkflowPage, useTriggerWorkflow } from '@/hooks/api/useWorkflows';
import WorkflowConfigPanel from '@/components/workflows/WorkflowConfigPanel';
import WorkflowExecutionHistory from '@/components/workflows/WorkflowExecutionHistory';
import WorkflowOutputViewer from '@/components/workflows/WorkflowOutputViewer';

const WorkflowPage: React.FC = () => {
  const { clientSlug, workflowSlug } = useParams<{
    clientSlug: string;
    workflowSlug: string;
  }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState({});

  const { data: workflowData, isLoading } = useWorkflowPage(
    clientSlug!,
    workflowSlug!
  );
  const triggerWorkflow = useTriggerWorkflow();

  if (isLoading) return <LoadingSpinner />;
  if (!workflowData) return <NotFound />;

  const { client, workflow, executions, latest_output } = workflowData;

  const handleTrigger = async () => {
    await triggerWorkflow.mutateAsync({
      clientSlug: clientSlug!,
      workflowSlug: workflowSlug!,
      params: config,
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link onClick={() => navigate('/clients')}>Clients</Link>
          <Link onClick={() => navigate(`/clients/${clientSlug}`)}>
            {client.name}
          </Link>
          <Typography color="text.primary">{workflow.name}</Typography>
        </Breadcrumbs>

        {/* Workflow Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h1" sx={{ fontSize: '3rem' }}>
                {workflow.icon}
              </Typography>
              <Box>
                <Typography variant="h4">{workflow.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {workflow.description}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column: Config + Trigger */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuration
                </Typography>
                <WorkflowConfigPanel
                  workflow={workflow}
                  config={config}
                  onChange={setConfig}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleTrigger}
                  disabled={triggerWorkflow.isPending}
                  sx={{ mt: 3 }}
                >
                  {triggerWorkflow.isPending ? 'Running...' : 'Run Workflow'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Output + History */}
          <Grid item xs={12} md={8}>
            {/* Latest Output */}
            {latest_output && (
              <Box sx={{ mb: 3 }}>
                <WorkflowOutputViewer output={latest_output} />
              </Box>
            )}

            {/* Execution History */}
            <WorkflowExecutionHistory executions={executions} />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default WorkflowPage;
```

---

## Pages to Delete

### Delete Project Pages

```bash
# Run these commands in frontend directory
rm -rf src/pages/Projects/
```

**Files being deleted:**
- `CreateProject.tsx` (269 bytes)
- `EditProject.tsx` (272 bytes)
- `ProjectDetail.tsx` (22,523 bytes)
- `ProjectCrawling.tsx` (8,061 bytes)

**Total cleanup:** ~31 KB of unused code

---

## Components to Create

### 1. Client Components

**Directory:** `frontend/src/components/client/`

#### ClientProfileHeader.tsx
```tsx
// frontend/src/components/client/ClientProfileHeader.tsx

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Edit, Delete, MoreVert } from '@mui/icons-material';
import { Client } from '@/client';

interface ClientProfileHeaderProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

const ClientProfileHeader: React.FC<ClientProfileHeaderProps> = ({
  client,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Logo */}
          <Avatar
            src={client.logo_url || undefined}
            alt={client.name}
            sx={{ width: 80, height: 80 }}
          >
            {client.name[0]}
          </Avatar>

          {/* Info */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              {client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {client.slug}
            </Typography>
            {client.website_url && (
              <Typography
                variant="body2"
                component="a"
                href={client.website_url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main', textDecoration: 'none' }}
              >
                {client.website_url}
              </Typography>
            )}
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {client.industry && <Chip label={client.industry} size="small" />}
              {client.team_lead && (
                <Chip
                  label={`Lead: ${client.team_lead}`}
                  size="small"
                  variant="outlined"
                />
              )}
              <Chip
                label={client.status}
                size="small"
                color={client.status === 'Active' ? 'success' : 'default'}
              />
            </Box>
          </Box>

          {/* Actions */}
          <Box>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={onEdit}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} /> Delete Client
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClientProfileHeader;
```

#### EngineBox.tsx
```tsx
// frontend/src/components/client/EngineBox.tsx

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  Build,
  PlayArrow,
  Description,
  Refresh,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { Client, EngineStatus } from '@/client';

interface EngineBoxProps {
  client: Client;
  engineStatus: EngineStatus;
  onStartExtraction: () => void;
  onViewPages: () => void;
  onRerunSetup: () => void;
}

const EngineBox: React.FC<EngineBoxProps> = ({
  client,
  engineStatus,
  onStartExtraction,
  onViewPages,
  onRerunSetup,
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusIcon = () => {
    if (engineStatus.isActive) {
      return <CheckCircle color="success" />;
    }
    return <Error color="error" />;
  };

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Build fontSize="large" color="primary" />
            <Typography variant="h5">Engine</Typography>
          </Box>
          <Chip
            icon={getStatusIcon()}
            label={engineStatus.isActive ? 'Active' : 'Inactive'}
            color={engineStatus.isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>

        {/* Stats */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Pages Discovered:</strong> {engineStatus.pageCount} pages
          </Typography>
          {engineStatus.lastCrawl && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>Last Full Crawl:</strong>{' '}
                {formatDate(engineStatus.lastCrawl.date)} (
                {engineStatus.lastCrawl.duration})
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong>{' '}
                <Chip
                  label={engineStatus.lastCrawl.status}
                  size="small"
                  color={
                    engineStatus.lastCrawl.status === 'completed'
                      ? 'success'
                      : 'warning'
                  }
                />
              </Typography>
            </>
          )}
          {engineStatus.nextScheduled && (
            <Typography variant="body1" gutterBottom>
              <strong>Next Scheduled:</strong>{' '}
              {formatDate(engineStatus.nextScheduled)}
            </Typography>
          )}
        </Box>

        {/* Data Coverage Progress */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="body2">Data Coverage</Typography>
            <Typography variant="body2">
              {engineStatus.dataCoverage.extracted}/
              {engineStatus.dataCoverage.total} data points (
              {engineStatus.dataCoverage.percentage}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={engineStatus.dataCoverage.percentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            onClick={onStartExtraction}
            startIcon={<PlayArrow />}
          >
            Start Data Extraction
          </Button>
          <Button
            variant="outlined"
            onClick={onViewPages}
            startIcon={<Description />}
          >
            View All Pages ({engineStatus.pageCount})
          </Button>
          <Button variant="text" onClick={onRerunSetup} startIcon={<Refresh />}>
            Re-run Engine Setup
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EngineBox;
```

#### WorkflowsAppsToggle.tsx
```tsx
// frontend/src/components/client/WorkflowsAppsToggle.tsx

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Grid,
  Chip,
} from '@mui/material';
import { ExpandMore, Add } from '@mui/icons-material';
import WorkflowCard from './WorkflowCard';
import { Client, WorkflowDefinition, ClientWorkflowExecution } from '@/client';

interface WorkflowsAppsToggleProps {
  client: Client;
  workflows: WorkflowDefinition[];
  recentExecutions: ClientWorkflowExecution[];
  expanded: boolean;
  onToggle: () => void;
  onLaunchWorkflow: (slug: string) => void;
}

const WorkflowsAppsToggle: React.FC<WorkflowsAppsToggleProps> = ({
  client,
  workflows,
  recentExecutions,
  expanded,
  onToggle,
  onLaunchWorkflow,
}) => {
  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={onToggle}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
              size="small"
            >
              <ExpandMore />
            </IconButton>
            <Typography variant="h5">Workflows & Apps</Typography>
            <Chip label={workflows.length} size="small" />
          </Box>
          <IconButton size="small" onClick={(e) => e.stopPropagation()}>
            <Add />
          </IconButton>
        </Box>

        {/* Workflows Grid */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {workflows.map((workflow) => {
                const lastExecution = recentExecutions.find(
                  (ex) => ex.workflow_slug === workflow.slug
                );

                return (
                  <Grid item xs={12} sm={6} md={3} key={workflow.slug}>
                    <WorkflowCard
                      workflow={workflow}
                      lastExecution={lastExecution}
                      onLaunch={() => onLaunchWorkflow(workflow.slug)}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default WorkflowsAppsToggle;
```

#### WorkflowCard.tsx
```tsx
// frontend/src/components/client/WorkflowCard.tsx

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { WorkflowDefinition, ClientWorkflowExecution } from '@/client';

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  lastExecution?: ClientWorkflowExecution;
  onLaunch: () => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  lastExecution,
  onLaunch,
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-4px)',
          cursor: 'pointer',
        },
      }}
      onClick={onLaunch}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Icon */}
        <Box sx={{ fontSize: '3rem', textAlign: 'center', mb: 1 }}>
          {workflow.icon}
        </Box>

        {/* Name */}
        <Typography variant="h6" align="center" gutterBottom>
          {workflow.name}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{
            minHeight: 40,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {workflow.description}
        </Typography>

        {/* Last Execution */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          {lastExecution ? (
            <>
              <Typography variant="caption" color="text.secondary">
                Last run:
              </Typography>
              <Typography variant="body2">
                {formatDate(lastExecution.created_at)}
              </Typography>
              {lastExecution.status && (
                <Chip
                  label={lastExecution.status}
                  size="small"
                  color={getStatusColor(lastExecution.status)}
                  sx={{ mt: 1 }}
                />
              )}
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Never run
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button variant="contained" size="small" fullWidth onClick={onLaunch}>
          Launch
        </Button>
      </CardActions>
    </Card>
  );
};

export default WorkflowCard;
```

---

### 2. Workflow Components

**Directory:** `frontend/src/components/workflows/`

Create these components:
- `WorkflowConfigPanel.tsx` - Configuration inputs for workflow
- `WorkflowExecutionHistory.tsx` - List of past executions
- `WorkflowOutputViewer.tsx` - Display PDF/JSON outputs

---

## Routing Changes

### Update App.tsx

**File:** `frontend/src/App.tsx`

**Changes:**

```tsx
// 1. Remove old imports (lines 51-54)
// DELETE:
import CreateProject from "./pages/Projects/CreateProject";
import EditProject from "./pages/Projects/EditProject";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import ProjectCrawling from "./pages/Projects/ProjectCrawling";

// 2. Add new imports
import ClientProfilePage from "./pages/Clients/ClientProfilePage";
import EngineDetailPage from "./pages/Clients/EngineDetailPage";
import WorkflowPage from "./pages/Workflows/WorkflowPage";

// 3. In Routes section, remove old project routes:
// DELETE:
<Route path="/projects/create/:clientId" element={<CreateProject />} />
<Route path="/projects/:projectId/edit" element={<EditProject />} />
<Route path="/projects/:projectId" element={<ProjectDetail />} />
<Route path="/projects/:projectId/crawl" element={<ProjectCrawling />} />

// 4. Add new routes:
<Route path="/clients/:clientSlug" element={<ClientProfilePage />} />
<Route path="/clients/:clientSlug/engine" element={<EngineDetailPage />} />
<Route path="/clients/:clientSlug/engine/pages" element={<EnginePages />} />
<Route path="/clients/:clientSlug/:workflowSlug" element={<WorkflowPage />} />
```

---

## API Hooks

### Create New Hooks

**Directory:** `frontend/src/hooks/api/`

#### useClients.ts (Update)

```tsx
// frontend/src/hooks/api/useClients.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientsService, Client } from '@/client';

// NEW: Get client by slug
export const useClientBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['client', slug],
    queryFn: () => ClientsService.getClientBySlug({ clientSlug: slug }),
    enabled: !!slug,
  });
};

// Existing hooks...
export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => ClientsService.listClients(),
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ClientsService.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

// ... other existing hooks
```

#### useWorkflows.ts (New)

```tsx
// frontend/src/hooks/api/useWorkflows.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowsService } from '@/client';

// Get all workflow definitions
export const useWorkflowDefinitions = () => {
  return useQuery({
    queryKey: ['workflow-definitions'],
    queryFn: () => WorkflowsService.listWorkflowDefinitions(),
  });
};

// Get workflow page data (definition + client + history)
export const useWorkflowPage = (clientSlug: string, workflowSlug: string) => {
  return useQuery({
    queryKey: ['workflow-page', clientSlug, workflowSlug],
    queryFn: () =>
      WorkflowsService.getWorkflowPage({ clientSlug, workflowSlug }),
    enabled: !!(clientSlug && workflowSlug),
  });
};

// Trigger workflow
export const useTriggerWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientSlug,
      workflowSlug,
      params,
    }: {
      clientSlug: string;
      workflowSlug: string;
      params: any;
    }) =>
      WorkflowsService.triggerWorkflow({ clientSlug, workflowSlug, params }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workflow-page', variables.clientSlug, variables.workflowSlug],
      });
    },
  });
};

// Get workflow execution history
export const useWorkflowHistory = (
  clientSlug: string,
  workflowSlug: string,
  limit = 20
) => {
  return useQuery({
    queryKey: ['workflow-history', clientSlug, workflowSlug, limit],
    queryFn: () =>
      WorkflowsService.getWorkflowHistory({ clientSlug, workflowSlug, limit }),
    enabled: !!(clientSlug && workflowSlug),
  });
};
```

---

## Implementation Checklist

### Phase 1: Cleanup (Week 1, Day 1)

- [ ] **Backup current code** (git commit)
- [ ] Delete `frontend/src/pages/Projects/` folder
- [ ] Remove project imports from `App.tsx`
- [ ] Remove project routes from `App.tsx`
- [ ] Test that app still compiles: `npm run dev`
- [ ] Commit: "Remove project pages and routes"

### Phase 2: Backend API (Week 1, Days 2-3)

**Backend changes needed first:**
- [ ] Update `clients.py` controller to accept `slug` param
- [ ] Create `workflows.py` controller with endpoints
- [ ] Add `WorkflowDefinition` and `ClientWorkflowExecution` models
- [ ] Run migration
- [ ] Seed workflow definitions
- [ ] Test endpoints with Postman/curl

### Phase 3: Generate API Client (Week 1, Day 3)

```bash
cd frontend
npm run generate-client
```

This regenerates TypeScript types based on new OpenAPI schema.

### Phase 4: Create Components (Week 1, Days 4-5)

Create in order:
1. [ ] `ClientProfileHeader.tsx`
2. [ ] `EngineBox.tsx`
3. [ ] `WorkflowCard.tsx`
4. [ ] `WorkflowsAppsToggle.tsx`
5. [ ] Test each component in isolation (Storybook optional)

### Phase 5: Create Pages (Week 2, Days 1-3)

1. [ ] `ClientProfilePage.tsx`
2. [ ] `EngineDetailPage.tsx`
3. [ ] `WorkflowPage.tsx`
4. [ ] Test navigation between pages

### Phase 6: Update Routing (Week 2, Day 4)

- [ ] Update `App.tsx` with new routes
- [ ] Update navigation links in sidebar/header
- [ ] Test all routes work
- [ ] Fix any broken links

### Phase 7: Create API Hooks (Week 2, Day 4)

- [ ] Update `useClients.ts` with `useClientBySlug`
- [ ] Create `useWorkflows.ts` with all hooks
- [ ] Wire up hooks in pages
- [ ] Test data fetching

### Phase 8: Integration Testing (Week 2, Day 5)

- [ ] Test full flow: Clients → Profile → Engine → Workflows
- [ ] Test workflow triggering
- [ ] Test error states
- [ ] Test loading states
- [ ] Test responsive design (mobile, tablet, desktop)

### Phase 9: Polish (Week 3, Day 1)

- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Add success/error toasts
- [ ] Improve animations/transitions
- [ ] Accessibility audit (keyboard nav, screen readers)

### Phase 10: Deploy (Week 3, Day 2)

- [ ] Build production: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Deploy to Render/Vercel
- [ ] Test in production
- [ ] Monitor for errors

---

## File Structure After Changes

```
frontend/src/
├── pages/
│   ├── Clients/
│   │   ├── MyClients.tsx              ✅ Existing
│   │   ├── CreateClient.tsx           ✅ Existing
│   │   ├── EditClient.tsx             ✅ Existing
│   │   ├── ClientProfilePage.tsx      🆕 NEW (replaces ClientDetail)
│   │   └── EngineDetailPage.tsx       🆕 NEW
│   │
│   ├── Workflows/
│   │   └── WorkflowPage.tsx           🆕 NEW
│   │
│   └── Projects/                      ❌ DELETED
│
├── components/
│   ├── client/
│   │   ├── ClientProfileHeader.tsx    🆕 NEW
│   │   ├── EngineBox.tsx              🆕 NEW
│   │   ├── WorkflowsAppsToggle.tsx    🆕 NEW
│   │   └── WorkflowCard.tsx           🆕 NEW
│   │
│   └── workflows/
│       ├── WorkflowConfigPanel.tsx    🆕 NEW
│       ├── WorkflowExecutionHistory.tsx 🆕 NEW
│       └── WorkflowOutputViewer.tsx   🆕 NEW
│
├── hooks/
│   └── api/
│       ├── useClients.ts              ✏️ UPDATE
│       └── useWorkflows.ts            🆕 NEW
│
└── App.tsx                            ✏️ UPDATE (routes)
```

---

## Testing Strategy

### Unit Tests

```tsx
// Example: WorkflowCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import WorkflowCard from '@/components/client/WorkflowCard';

describe('WorkflowCard', () => {
  const mockWorkflow = {
    slug: 'seo-audit',
    name: 'SEO Audit',
    description: 'Comprehensive SEO analysis',
    icon: '🎯',
    category: 'seo',
  };

  it('renders workflow name and icon', () => {
    render(<WorkflowCard workflow={mockWorkflow} onLaunch={jest.fn()} />);
    expect(screen.getByText('SEO Audit')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('calls onLaunch when clicked', () => {
    const handleLaunch = jest.fn();
    render(<WorkflowCard workflow={mockWorkflow} onLaunch={handleLaunch} />);
    fireEvent.click(screen.getByText('Launch'));
    expect(handleLaunch).toHaveBeenCalled();
  });

  it('displays "Never run" when no executions', () => {
    render(<WorkflowCard workflow={mockWorkflow} onLaunch={jest.fn()} />);
    expect(screen.getByText('Never run')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test complete user flows:
1. Navigate to client list
2. Click on a client
3. Verify Engine box displays
4. Expand Workflows section
5. Click on a workflow
6. Trigger workflow
7. Verify execution appears in history

---

## Performance Considerations

### Code Splitting

```tsx
// App.tsx - lazy load pages
import { lazy, Suspense } from 'react';

const ClientProfilePage = lazy(() => import('./pages/Clients/ClientProfilePage'));
const WorkflowPage = lazy(() => import('./pages/Workflows/WorkflowPage'));

// In Routes:
<Route
  path="/clients/:clientSlug"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <ClientProfilePage />
    </Suspense>
  }
/>
```

### Optimize Queries

```tsx
// Prefetch client data when hovering over client link
const handleMouseEnter = (slug: string) => {
  queryClient.prefetchQuery({
    queryKey: ['client', slug],
    queryFn: () => ClientsService.getClientBySlug({ clientSlug: slug }),
  });
};
```

---

## Migration Timeline

### Week 1: Backend + Components
- **Days 1-3:** Backend API changes, migration, seed data
- **Days 4-5:** Create all components

### Week 2: Pages + Integration
- **Days 1-3:** Create pages, wire up hooks
- **Day 4:** Update routing, API hooks
- **Day 5:** Integration testing

### Week 3: Polish + Deploy
- **Day 1:** Polish UI, accessibility
- **Day 2:** Deploy to production

**Total:** 3 weeks to complete redesign

---

## Summary

This frontend redesign:
- ✅ Removes all project-related code (~31 KB cleanup)
- ✅ Introduces client-centric UI with Engine + Workflows
- ✅ Uses slug-based routing (`/clients/:slug/:workflow`)
- ✅ Creates 7 new components (reusable, tested)
- ✅ Maintains existing tech stack (React, MUI, React Query)
- ✅ Follows Material-UI design patterns
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Accessible (keyboard navigation, screen readers)

**Ready to implement!**

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Status**: Implementation Ready
