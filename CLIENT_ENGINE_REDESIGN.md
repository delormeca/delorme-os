# Client Engine & Workflows Redesign

**Date**: 2025-11-12
**Status**: 🎨 UI/UX Design Document
**Goal**: Remove "Projects", introduce "Engine" + "Workflows & Apps" toggle interface

---

## Table of Contents

1. [Overview](#overview)
2. [Current vs New Structure](#current-vs-new-structure)
3. [URL Structure](#url-structure)
4. [UI/UX Design](#uiux-design)
5. [Component Architecture](#component-architecture)
6. [Workflows & Apps Catalog](#workflows--apps-catalog)
7. [Implementation Plan](#implementation-plan)
8. [Database Changes](#database-changes)
9. [API Endpoints](#api-endpoints)
10. [Frontend Components](#frontend-components)

---

## Overview

### Vision

Transform the client detail page from a project-based system to a streamlined **Engine + Workflows** interface:

```
┌────────────────────────────────────────────────────────┐
│  Client Detail Page                                    │
│  /clients/lasalle-college                             │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  🔧 Engine                                    │    │
│  │  ─────────────────────────────────────────   │    │
│  │  Status: Active ✓                             │    │
│  │  Pages Discovered: 487                        │    │
│  │  Last Crawl: Jan 15, 2025                     │    │
│  │  [Start Data Extraction]  [View All Pages]    │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ▼ Workflows & Apps                                   │
│  ┌──────────────────────────────────────────────┐    │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │    │
│  │  │ 🎯  │  │ 📊  │  │ 🔍  │  │ 📝  │          │    │
│  │  │ SEO │  │ Perf│  │ Tech│  │ Cont│          │    │
│  │  │Audit│  │ Dash│  │Audit│  │ Gap │          │    │
│  │  └─────┘  └─────┘  └─────┘  └─────┘          │    │
│  └──────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

## Current vs New Structure

### ❌ Current Structure (TO REMOVE)

```
/clients
  └─ /client-detail/:clientId
      ├─ Projects tab
      │   ├─ Project 1
      │   ├─ Project 2
      │   └─ Create Project
      ├─ Pages tab
      └─ Settings tab
```

### ✅ New Structure

```
/clients/:clientSlug
  └─ Client Profile Page
      ├─ Header (name, logo, metadata)
      ├─ 📦 Engine Box (crawl status, page count)
      │   ├─ Engine Setup Status
      │   ├─ Last Crawl Info
      │   └─ Actions (Start Extraction, View Pages)
      │
      └─ 🔧 Workflows & Apps (Collapsible)
          ├─ SEO Audit
          ├─ Performance Dashboard
          ├─ Technical Audit
          ├─ Content Gap Analysis
          ├─ Competitor Analysis
          ├─ Keyword Tracker
          ├─ Backlink Monitor
          └─ Custom Reports
```

---

## URL Structure

### New URL Pattern

**Client Profile:**
```
/clients/lasalle-college
/clients/nike
/clients/adidas-canada
```

**Engine Page (optional detail view):**
```
/clients/lasalle-college/engine
```

**Individual Workflows:**
```
/clients/lasalle-college/seo-audit
/clients/lasalle-college/performance-dashboard
/clients/lasalle-college/technical-audit
/clients/lasalle-college/content-gap-analysis
/clients/lasalle-college/competitor-analysis
/clients/lasalle-college/keyword-tracker
/clients/lasalle-college/backlink-monitor
/clients/lasalle-college/custom-reports
```

**Generic Workflow Pattern:**
```
/clients/:clientSlug/:workflowSlug
```

### Backend Routes

```python
# app/controllers/clients.py

@router.get("/{client_slug}", response_model=ClientDetailResponse)
async def get_client_by_slug(client_slug: str):
    """Get client details by slug"""

@router.get("/{client_slug}/engine", response_model=EngineStatusResponse)
async def get_client_engine_status(client_slug: str):
    """Get detailed engine status"""

# app/controllers/workflows.py

@router.get("/{client_slug}/{workflow_slug}", response_model=WorkflowPageResponse)
async def get_workflow_page(client_slug: str, workflow_slug: str):
    """Get workflow page data"""

@router.post("/{client_slug}/{workflow_slug}/trigger")
async def trigger_workflow(client_slug: str, workflow_slug: str):
    """Trigger workflow execution"""

@router.get("/{client_slug}/{workflow_slug}/history")
async def get_workflow_history(client_slug: str, workflow_slug: str):
    """Get workflow execution history"""
```

---

## UI/UX Design

### 1. Client Profile Header

```tsx
┌─────────────────────────────────────────────────────────────┐
│  [< Back to Clients]                                        │
│                                                              │
│  ┌────┐                                                      │
│  │LOGO│  LaSalle College Vancouver                          │
│  │    │  lasalle-college                                    │
│  └────┘  https://www.lasallecollege.com                     │
│          Industry: Education • Team Lead: Tommy Delorme      │
│                                                              │
│          [Edit Client]  [Delete Client]  [•••]              │
└─────────────────────────────────────────────────────────────┘
```

**Component:** `ClientProfileHeader.tsx`

```tsx
interface ClientProfileHeaderProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### 2. Engine Box

```tsx
┌─────────────────────────────────────────────────────────────┐
│  🔧 Engine                                           [⚙️]   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                              │
│  Status: ✓ Active                                           │
│  Pages Discovered: 487 pages                                │
│  Last Full Crawl: Jan 15, 2025 at 3:42 AM (3h 27m)         │
│  Next Scheduled: Feb 1, 2025                                │
│                                                              │
│  Data Coverage:                                             │
│  ██████████████████░░░░░░░░░░ 24/45 data points (53%)      │
│                                                              │
│  [🚀 Start Data Extraction]  [📄 View All Pages (487)]     │
│  [🔄 Re-run Engine Setup]                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Component:** `EngineBox.tsx`

```tsx
interface EngineBoxProps {
  client: Client;
  engineStatus: EngineStatus;
  onStartExtraction: () => void;
  onViewPages: () => void;
  onRerunSetup: () => void;
}

interface EngineStatus {
  isActive: boolean;
  pageCount: number;
  lastCrawl: {
    date: string;
    duration: string;
    status: 'completed' | 'failed' | 'in_progress';
  };
  nextScheduled?: string;
  dataCoverage: {
    extracted: number;
    total: number;
    percentage: number;
  };
}
```

**Features:**
- Real-time status indicator (green dot = active)
- Progress bar for data coverage
- Quick action buttons
- Link to detailed engine page (`/clients/:slug/engine`)

---

### 3. Workflows & Apps Toggle

```tsx
┌─────────────────────────────────────────────────────────────┐
│  ▼ Workflows & Apps                               [+ Add]   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │   🎯    │  │   📊    │  │   🔍    │  │   📝    │       │
│  │ SEO     │  │  Perf   │  │  Tech   │  │ Content │       │
│  │ Audit   │  │  Dash   │  │  Audit  │  │   Gap   │       │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤       │
│  │ Last:   │  │ Last:   │  │ Last:   │  │ Never   │       │
│  │ Jan 20  │  │ Jan 18  │  │ Jan 15  │  │  run    │       │
│  │         │  │         │  │         │  │         │       │
│  │[Launch] │  │[Launch] │  │[Launch] │  │[Launch] │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │   🔬    │  │   🎨    │  │   📈    │  │   📋    │       │
│  │Compete  │  │Keyword  │  │Backlink │  │ Custom  │       │
│  │Analysis │  │Tracker  │  │Monitor  │  │ Reports │       │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤       │
│  │ Last:   │  │ Last:   │  │ Last:   │  │ Last:   │       │
│  │ Jan 10  │  │ Never   │  │ Never   │  │ Dec 28  │       │
│  │         │  │         │  │         │  │         │       │
│  │[Launch] │  │[Launch] │  │[Launch] │  │[Launch] │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Component:** `WorkflowsAppsToggle.tsx`

```tsx
interface WorkflowsAppsToggleProps {
  client: Client;
  workflows: WorkflowDefinition[];
  workflowHistory: WorkflowExecution[];
  onLaunchWorkflow: (workflowSlug: string) => void;
  onAddWorkflow?: () => void;
}

interface WorkflowDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: 'seo' | 'performance' | 'content' | 'analytics';
  isEnabled: boolean;
}

interface WorkflowExecution {
  id: string;
  workflowSlug: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  outputUrl?: string;
}
```

**Interaction:**
- Click header to expand/collapse
- Grid layout (4 columns on desktop, 2 on tablet, 1 on mobile)
- Hover effect on cards
- Click "Launch" → Navigate to `/clients/:slug/:workflowSlug`

---

## Workflows & Apps Catalog

### Available Workflows

#### 1. 🎯 SEO Audit
**Slug:** `seo-audit`
**Description:** Comprehensive SEO analysis with actionable recommendations
**Features:**
- Missing meta descriptions
- Duplicate titles
- Broken canonical URLs
- Missing H1 tags
- Schema markup gaps
**Output:** PDF report + JSON data

#### 2. 📊 Performance Dashboard
**Slug:** `performance-dashboard`
**Description:** Real-time SEO performance metrics
**Features:**
- Word count trends
- Content depth analysis
- Indexability score
- Mobile optimization
**Output:** Interactive dashboard

#### 3. 🔍 Technical Audit
**Slug:** `technical-audit`
**Description:** Technical SEO health check
**Features:**
- Crawl errors
- Redirect chains
- Page speed issues
- Mobile responsiveness
- SSL/HTTPS status
**Output:** PDF report

#### 4. 📝 Content Gap Analysis
**Slug:** `content-gap-analysis`
**Description:** Identify missing content opportunities
**Features:**
- Compare with competitors
- Topic coverage gaps
- Keyword opportunities
- Content depth comparison
**Output:** Excel + PDF

#### 5. 🔬 Competitor Analysis
**Slug:** `competitor-analysis`
**Description:** Benchmark against competitors
**Features:**
- Side-by-side comparison
- Keyword overlap
- Content quality metrics
- Schema markup adoption
**Output:** Interactive report

#### 6. 🎨 Keyword Tracker
**Slug:** `keyword-tracker`
**Description:** Track target keywords over time
**Features:**
- Keyword rankings
- Search volume
- Difficulty scores
- Trending keywords
**Output:** Dashboard + CSV

#### 7. 📈 Backlink Monitor
**Slug:** `backlink-monitor`
**Description:** Monitor backlink profile
**Features:**
- New/lost backlinks
- Domain authority
- Anchor text distribution
- Toxic link detection
**Output:** Dashboard + alerts

#### 8. 📋 Custom Reports
**Slug:** `custom-reports`
**Description:** Generate custom client reports
**Features:**
- Template selection
- Custom metrics
- White-label branding
- Scheduled delivery
**Output:** PDF + Excel

---

## Component Architecture

### Component Tree

```
ClientProfilePage.tsx
├─ ClientProfileHeader.tsx
│  ├─ ClientLogo.tsx
│  ├─ ClientMetadata.tsx
│  └─ ClientActions.tsx
│
├─ EngineBox.tsx
│  ├─ EngineStatus.tsx
│  ├─ EngineStats.tsx
│  ├─ EngineProgressBar.tsx
│  └─ EngineActions.tsx
│
└─ WorkflowsAppsToggle.tsx
   ├─ WorkflowCard.tsx (repeated)
   │  ├─ WorkflowIcon.tsx
   │  ├─ WorkflowInfo.tsx
   │  └─ WorkflowActions.tsx
   └─ AddWorkflowButton.tsx
```

### Workflow Page Structure

```
WorkflowPage.tsx (/clients/:slug/:workflowSlug)
├─ WorkflowHeader.tsx
│  ├─ Breadcrumb: Client > Workflow
│  ├─ Workflow title + icon
│  └─ Last run info
│
├─ WorkflowControls.tsx
│  ├─ [Run Workflow] button
│  ├─ Configuration panel
│  └─ Schedule options
│
├─ WorkflowOutputs.tsx (if has history)
│  ├─ Latest output preview
│  └─ Output history list
│
└─ WorkflowSettings.tsx
   ├─ Input parameters
   ├─ Notification settings
   └─ n8n webhook config
```

---

## Database Changes

### Remove Projects Table

```sql
-- Drop projects table (if exists)
DROP TABLE IF EXISTS project CASCADE;
```

### Add Workflow Tracking

```python
# app/models.py

class WorkflowDefinition(UUIDModelBase, table=True):
    """
    Catalog of available workflows
    System-wide, not per-client
    """
    __tablename__ = "workflow_definition"

    slug: str = Field(unique=True, index=True)
    # "seo-audit", "performance-dashboard", etc.

    name: str
    # "SEO Audit", "Performance Dashboard"

    description: str
    # "Comprehensive SEO analysis..."

    icon: str
    # Emoji or icon name: "🎯", "chart-line"

    category: str
    # "seo", "performance", "content", "analytics"

    n8n_workflow_id: Optional[str] = None
    # n8n webhook ID if applicable

    is_enabled: bool = Field(default=True)
    # Can disable workflows system-wide

    config_schema: Optional[dict] = Field(sa_column=Column(JSON))
    # JSON schema for workflow input parameters

    created_at: datetime = Field(default_factory=get_utcnow)
    updated_at: datetime = Field(default_factory=get_utcnow)


class ClientWorkflowExecution(UUIDModelBase, table=True):
    """
    Track workflow executions per client
    Replaces WorkflowOutput with cleaner structure
    """
    __tablename__ = "client_workflow_execution"

    client_id: uuid.UUID = Field(foreign_key="client.id", index=True)
    workflow_slug: str = Field(index=True)
    # Reference to WorkflowDefinition.slug

    triggered_by: uuid.UUID = Field(foreign_key="user.id")

    # Execution status
    status: str = Field(default="pending", index=True)
    # "pending", "running", "completed", "failed"

    # Input parameters
    input_params: dict = Field(sa_column=Column(JSON))

    # Output storage
    output_type: Optional[str] = None
    # "pdf", "json", "dashboard_url", etc.

    output_path: Optional[str] = None
    # S3 path or dashboard URL

    # Preview data (for cards)
    preview_data: Optional[dict] = Field(sa_column=Column(JSON))
    # {"summary": "15 issues found", "priority_issues": 8}

    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

    # Error tracking
    error_message: Optional[str] = None

    created_at: datetime = Field(default_factory=get_utcnow)

    # Relationships
    client: "Client" = Relationship()
```

### Migration

```python
# migrations/versions/xxx_remove_projects_add_workflows.py

def upgrade():
    # Drop project table
    op.drop_table('project')

    # Create workflow_definition table
    op.create_table(
        'workflow_definition',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('slug', sa.String(), nullable=False, unique=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('n8n_workflow_id', sa.String(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), default=True),
        sa.Column('config_schema', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Create client_workflow_execution table
    op.create_table(
        'client_workflow_execution',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workflow_slug', sa.String(), nullable=False),
        sa.Column('triggered_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('input_params', postgresql.JSON(), nullable=True),
        sa.Column('output_type', sa.String(), nullable=True),
        sa.Column('output_path', sa.String(), nullable=True),
        sa.Column('preview_data', postgresql.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['client.id']),
        sa.ForeignKeyConstraint(['triggered_by'], ['user.id']),
    )

    op.create_index('ix_workflow_execution_client', 'client_workflow_execution', ['client_id'])
    op.create_index('ix_workflow_execution_workflow', 'client_workflow_execution', ['workflow_slug'])
    op.create_index('ix_workflow_execution_status', 'client_workflow_execution', ['status'])

def downgrade():
    op.drop_table('client_workflow_execution')
    op.drop_table('workflow_definition')
```

---

## API Endpoints

### Client Endpoints (Updated)

```python
# app/controllers/clients.py

@router.get("/{client_slug}", response_model=ClientDetailResponse)
async def get_client_by_slug(
    client_slug: str,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get client profile by slug

    Returns:
    - Client metadata
    - Engine status
    - Available workflows
    - Recent workflow executions
    """
    statement = select(Client).where(Client.slug == client_slug)
    result = await db.execute(statement)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get engine status
    engine_status = await get_engine_status(client.id, db)

    # Get available workflows
    workflows = await get_available_workflows(db)

    # Get recent executions
    recent_executions = await get_recent_workflow_executions(client.id, db)

    return ClientDetailResponse(
        client=client,
        engine_status=engine_status,
        workflows=workflows,
        recent_executions=recent_executions,
    )


@router.get("/{client_slug}/engine", response_model=EngineDetailResponse)
async def get_client_engine_detail(
    client_slug: str,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Detailed engine status page"""
    # Full engine stats, crawl history, etc.
```

### Workflow Endpoints (New)

```python
# app/controllers/workflows.py

@router.get("/definitions", response_model=List[WorkflowDefinitionResponse])
async def list_workflow_definitions(
    db: AsyncSession = Depends(get_async_db_session),
):
    """Get all available workflow definitions"""
    statement = select(WorkflowDefinition).where(
        WorkflowDefinition.is_enabled == True
    )
    result = await db.execute(statement)
    return result.scalars().all()


@router.get("/{client_slug}/{workflow_slug}", response_model=WorkflowPageResponse)
async def get_workflow_page(
    client_slug: str,
    workflow_slug: str,
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Get workflow page data

    Returns:
    - Workflow definition
    - Client info
    - Execution history
    - Latest output (if any)
    """
    # Get client
    client = await get_client_by_slug(client_slug, db)

    # Get workflow definition
    workflow = await get_workflow_by_slug(workflow_slug, db)

    # Get execution history
    executions = await get_workflow_executions(
        client_id=client.id,
        workflow_slug=workflow_slug,
        db=db,
    )

    return WorkflowPageResponse(
        client=client,
        workflow=workflow,
        executions=executions,
        latest_output=executions[0] if executions else None,
    )


@router.post("/{client_slug}/{workflow_slug}/trigger")
async def trigger_workflow(
    client_slug: str,
    workflow_slug: str,
    params: WorkflowTriggerRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger workflow execution

    Creates ClientWorkflowExecution record
    Sends request to n8n (if applicable)
    """
    client = await get_client_by_slug(client_slug, db)
    workflow = await get_workflow_by_slug(workflow_slug, db)

    # Create execution record
    execution = ClientWorkflowExecution(
        client_id=client.id,
        workflow_slug=workflow_slug,
        triggered_by=current_user.id,
        input_params=params.dict(),
        status="pending",
    )
    db.add(execution)
    await db.commit()

    # Trigger n8n workflow (if configured)
    if workflow.n8n_workflow_id:
        await trigger_n8n_workflow(
            workflow_id=workflow.n8n_workflow_id,
            execution_id=execution.id,
            client=client,
            params=params.dict(),
        )

    return {"execution_id": execution.id, "status": "pending"}


@router.get("/{client_slug}/{workflow_slug}/history")
async def get_workflow_history(
    client_slug: str,
    workflow_slug: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Get execution history for a workflow"""
    client = await get_client_by_slug(client_slug, db)

    statement = (
        select(ClientWorkflowExecution)
        .where(
            ClientWorkflowExecution.client_id == client.id,
            ClientWorkflowExecution.workflow_slug == workflow_slug,
        )
        .order_by(ClientWorkflowExecution.created_at.desc())
        .limit(limit)
    )

    result = await db.execute(statement)
    return result.scalars().all()
```

---

## Frontend Components

### 1. ClientProfilePage.tsx

```tsx
// frontend/src/pages/ClientProfilePage.tsx

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { useClientBySlug } from '@/hooks/api/useClients';

import ClientProfileHeader from '@/components/client/ClientProfileHeader';
import EngineBox from '@/components/client/EngineBox';
import WorkflowsAppsToggle from '@/components/client/WorkflowsAppsToggle';

const ClientProfilePage: React.FC = () => {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const { data: clientData, isLoading } = useClientBySlug(clientSlug);
  const [workflowsExpanded, setWorkflowsExpanded] = useState(true);

  if (isLoading) return <CircularProgress />;
  if (!clientData) return <NotFound />;

  const { client, engine_status, workflows, recent_executions } = clientData;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <ClientProfileHeader client={client} />

        {/* Engine Box */}
        <Box sx={{ mt: 4 }}>
          <EngineBox
            client={client}
            engineStatus={engine_status}
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
          />
        </Box>
      </Box>
    </Container>
  );
};

export default ClientProfilePage;
```

### 2. EngineBox.tsx

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
} from '@mui/material';
import { Build as BuildIcon } from '@mui/icons-material';

interface EngineBoxProps {
  client: Client;
  engineStatus: EngineStatus;
}

const EngineBox: React.FC<EngineBoxProps> = ({ client, engineStatus }) => {
  const navigate = useNavigate();

  const handleStartExtraction = () => {
    // Trigger extraction
  };

  const handleViewPages = () => {
    navigate(`/clients/${client.slug}/engine/pages`);
  };

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon fontSize="large" color="primary" />
            <Typography variant="h5">Engine</Typography>
          </Box>
          <Chip
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
          <Typography variant="body1" gutterBottom>
            <strong>Last Full Crawl:</strong>{' '}
            {engineStatus.lastCrawl?.date
              ? `${formatDate(engineStatus.lastCrawl.date)} (${engineStatus.lastCrawl.duration})`
              : 'Never'}
          </Typography>
          {engineStatus.nextScheduled && (
            <Typography variant="body1" gutterBottom>
              <strong>Next Scheduled:</strong> {formatDate(engineStatus.nextScheduled)}
            </Typography>
          )}
        </Box>

        {/* Data Coverage */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Data Coverage: {engineStatus.dataCoverage.extracted}/{engineStatus.dataCoverage.total} data points (
            {engineStatus.dataCoverage.percentage}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={engineStatus.dataCoverage.percentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartExtraction}
            startIcon={<PlayArrowIcon />}
          >
            Start Data Extraction
          </Button>
          <Button
            variant="outlined"
            onClick={handleViewPages}
            startIcon={<DescriptionIcon />}
          >
            View All Pages ({engineStatus.pageCount})
          </Button>
          <Button variant="text" startIcon={<RefreshIcon />}>
            Re-run Engine Setup
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EngineBox;
```

### 3. WorkflowsAppsToggle.tsx

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
} from '@mui/material';
import { ExpandMore, Add } from '@mui/icons-material';
import WorkflowCard from './WorkflowCard';

interface WorkflowsAppsToggleProps {
  client: Client;
  workflows: WorkflowDefinition[];
  recentExecutions: ClientWorkflowExecution[];
  expanded: boolean;
  onToggle: () => void;
}

const WorkflowsAppsToggle: React.FC<WorkflowsAppsToggleProps> = ({
  client,
  workflows,
  recentExecutions,
  expanded,
  onToggle,
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
            >
              <ExpandMore />
            </IconButton>
            <Typography variant="h5">Workflows & Apps</Typography>
            <Chip label={workflows.length} size="small" />
          </Box>
          <IconButton size="small">
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
                      client={client}
                      lastExecution={lastExecution}
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

### 4. WorkflowCard.tsx

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
import { useNavigate } from 'react-router-dom';

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  client: Client;
  lastExecution?: ClientWorkflowExecution;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  client,
  lastExecution,
}) => {
  const navigate = useNavigate();

  const handleLaunch = () => {
    navigate(`/clients/${client.slug}/${workflow.slug}`);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'warning';
      default: return 'default';
    }
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
        },
      }}
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
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={handleLaunch}
        >
          Launch
        </Button>
      </CardActions>
    </Card>
  );
};

export default WorkflowCard;
```

---

## Implementation Plan

### Phase 1: Backend Restructure (Week 1)

**Tasks:**
- [ ] Create migration to remove `project` table
- [ ] Create `WorkflowDefinition` model
- [ ] Create `ClientWorkflowExecution` model
- [ ] Run migration
- [ ] Seed initial workflow definitions

**Seed Data:**

```python
# app/commands/seed_workflows.py

async def seed_workflow_definitions():
    """Seed initial workflow definitions"""

    workflows = [
        {
            "slug": "seo-audit",
            "name": "SEO Audit",
            "description": "Comprehensive SEO analysis with actionable recommendations",
            "icon": "🎯",
            "category": "seo",
        },
        {
            "slug": "performance-dashboard",
            "name": "Performance Dashboard",
            "description": "Real-time SEO performance metrics",
            "icon": "📊",
            "category": "analytics",
        },
        {
            "slug": "technical-audit",
            "name": "Technical Audit",
            "description": "Technical SEO health check",
            "icon": "🔍",
            "category": "seo",
        },
        {
            "slug": "content-gap-analysis",
            "name": "Content Gap Analysis",
            "description": "Identify missing content opportunities",
            "icon": "📝",
            "category": "content",
        },
        {
            "slug": "competitor-analysis",
            "name": "Competitor Analysis",
            "description": "Benchmark against competitors",
            "icon": "🔬",
            "category": "analytics",
        },
        {
            "slug": "keyword-tracker",
            "name": "Keyword Tracker",
            "description": "Track target keywords over time",
            "icon": "🎨",
            "category": "seo",
        },
        {
            "slug": "backlink-monitor",
            "name": "Backlink Monitor",
            "description": "Monitor backlink profile",
            "icon": "📈",
            "category": "seo",
        },
        {
            "slug": "custom-reports",
            "name": "Custom Reports",
            "description": "Generate custom client reports",
            "icon": "📋",
            "category": "analytics",
        },
    ]

    for workflow_data in workflows:
        workflow = WorkflowDefinition(**workflow_data)
        db.add(workflow)

    await db.commit()
```

---

### Phase 2: API Endpoints (Week 1-2)

**Tasks:**
- [ ] Update `clients.py` controller
  - [ ] Change ID param to slug param
  - [ ] Add engine status to response
  - [ ] Add workflows to response
- [ ] Create new `workflows.py` controller
  - [ ] List definitions endpoint
  - [ ] Get workflow page endpoint
  - [ ] Trigger workflow endpoint
  - [ ] History endpoint
- [ ] Update frontend API client
  - [ ] `task frontend:generate-client`

---

### Phase 3: Frontend Components (Week 2-3)

**Tasks:**
- [ ] Create `ClientProfilePage.tsx`
- [ ] Create `ClientProfileHeader.tsx`
- [ ] Create `EngineBox.tsx`
- [ ] Create `WorkflowsAppsToggle.tsx`
- [ ] Create `WorkflowCard.tsx`
- [ ] Update routing in `App.tsx`
- [ ] Add hooks:
  - [ ] `useClientBySlug()`
  - [ ] `useWorkflowDefinitions()`
  - [ ] `useTriggerWorkflow()`
  - [ ] `useWorkflowHistory()`

---

### Phase 4: Individual Workflow Pages (Week 3-4)

**Tasks:**
- [ ] Create `WorkflowPage.tsx` (generic)
- [ ] Create workflow-specific components:
  - [ ] SEO Audit view
  - [ ] Performance Dashboard view
  - [ ] Technical Audit view
  - [ ] (others as needed)
- [ ] Add workflow output viewers
- [ ] Add workflow configuration panels

---

### Phase 5: Testing & Polish (Week 4)

**Tasks:**
- [ ] Test all workflows
- [ ] Test routing
- [ ] Responsive design check
- [ ] Accessibility audit
- [ ] Performance optimization

---

## Summary

This redesign:
- ✅ Removes "Projects" concept
- ✅ Introduces clean "Engine" box
- ✅ Adds expandable "Workflows & Apps" section
- ✅ Uses slug-based URLs: `/clients/:slug/:workflow`
- ✅ Provides 8 pre-defined workflows
- ✅ Supports future workflow additions
- ✅ Maintains n8n integration capability
- ✅ Improves UX with card-based interface

**Ready to implement!**

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Status**: Ready for Review & Implementation
