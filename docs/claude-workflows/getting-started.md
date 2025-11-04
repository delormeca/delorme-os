# Getting Started with Claude Code

This boilerplate is optimized for Claude Code - Anthropic's command-line agentic coding assistant. Claude automatically understands your project through the `CLAUDE.md` file and provides intelligent code assistance.

## Quick Start

### 1. Install Claude Code

```bash
# Install Claude Code CLI
curl -fsSL https://claude.ai/install.sh | sh

# Verify installation
claude --version
```

### 2. Start Claude in Your Project

```bash
# Navigate to project root
cd craftyourstartup-boilerplate

# Start Claude
claude
```

Claude will automatically:
- Read `CLAUDE.md` for project context
- Load `.claude/settings.json` for permissions
- Make custom commands available via `/` menu

### 3. Your First Commands

Try these to get started:

```
# Ask Claude to explain the project
"Give me an overview of this project's architecture"

# Generate a new API endpoint
/new-api-endpoint GET /api/users/{id}/stats returns user activity statistics

# Create a React component  
/new-component UserStatsCard displays user statistics with charts

# Run tests
/run-tests

# Fix linting issues
/fix-lint
```

## Custom Slash Commands

Press `/` in Claude to see all available commands:

- `/new-api-endpoint` - Generate complete FastAPI endpoint
- `/new-component` - Create React component with MUI
- `/add-payment-feature` - Extend Stripe integration
- `/create-migration` - Generate database migration
- `/run-tests` - Execute test suite
- `/fix-lint` - Auto-fix linting issues

## Common Workflows

### Adding a New Feature

```
You: "I want to add a feature where users can bookmark articles"

Claude will:
1. Create database migration for bookmarks table
2. Add Bookmark model to models.py
3. Create bookmark service with business logic
4. Add API endpoints in controllers
5. Generate TypeScript client
6. Create React hooks for bookmarks
7. Add UI components
8. Write tests
```

### Debugging Issues

```
You: "The payment webhook is failing with 400 error"

Claude will:
1. Read webhook handler code
2. Check Stripe webhook signature verification
3. Review error logs
4. Identify the issue
5. Suggest and implement fix
6. Test the webhook flow
```

### Refactoring Code

```
You: "Refactor the analytics service to use a factory pattern"

Claude will:
1. Analyze current analytics_service.py
2. Design factory pattern structure
3. Implement the refactoring
4. Update all imports
5. Run tests to verify
6. Fix any breaking changes
```

## Power Tips

### 1. Use `CLAUDE.md` for Project-Specific Info

The `CLAUDE.md` file contains all your project's essential context. Claude reads this automatically on every session. Add custom commands, gotchas, and patterns here.

### 2. Manage Permissions Wisely

Claude respects the permissions in `.claude/settings.json`. Common safe actions like file editing are pre-approved. Destructive commands still require approval.

### 3. Use `/clear` Between Tasks

Reset Claude's context between unrelated tasks to keep responses focused:

```
# After completing payment feature
/clear

# Start fresh with analytics feature
"Now let's add analytics dashboard"
```

### 4. Provide Visual Context

Claude can read images! Share screenshots of UI mockups, error messages, or diagrams:

```
"Here's the design for the new dashboard [paste screenshot]
Please implement this using Material-UI"
```

### 5. Iterate on Output

Claude's first solution might not be perfect. Iterate:

```
You: "The button should be on the right, not left"
Claude: [updates code]

You: "Use primary color instead of secondary"  
Claude: [updates again]
```

## Project-Specific Patterns

### When Adding API Endpoints

Always follow this order:
1. Schemas (request/response models)
2. Service (business logic)
3. Controller (HTTP endpoint)
4. Generate client: `task frontend:generate-client`
5. Create React hook
6. Update UI

Tell Claude: "Follow the clean architecture pattern for this API"

### When Working with Payments

Always test webhooks locally:

```bash
# In separate terminal
stripe listen --forward-to localhost:8000/api/payments/webhook

# Then tell Claude
"Test the payment flow with Stripe CLI listening"
```

### When Creating Migrations

Always review before applying:

```
"Create migration for adding email_verified to users"
[Review generated migration]
"Apply the migration"
```

## Multi-Claude Workflows (Advanced)

For complex features, run multiple Claude instances:

### Terminal 1: Backend
```bash
cd backend-worktree
claude
# "Implement the API endpoints for social auth"
```

### Terminal 2: Frontend
```bash
cd frontend-worktree  
claude
# "Create UI components for social login buttons"
```

### Terminal 3: Testing
```bash
cd main-worktree
claude
# "Write integration tests for social auth flow"
```

Each Claude works independently and in parallel!

## Headless Mode (Automation)

Use Claude in scripts and CI/CD:

```bash
# Analyze all log files
claude -p "Analyze these logs and summarize errors" < app.log

# Auto-fix linting in CI
claude -p "Fix all linting errors" --allowedTools Edit Bash(git commit:*)

# Generate migration
claude -p "Create migration for $FEATURE_NAME"
```

## Troubleshooting

### Claude doesn't know about my changes

Use `/clear` to reset context, or mention specific files:

```
"Read the updated payment_manager.py and continue"
```

### Commands failing

Check `.claude/settings.json` permissions:

```
/permissions
# Add tools as needed
```

### Claude is confused

Provide more context:

```
"Read CLAUDE.md again and follow the patterns for API endpoints"
```

## Best Practices

✅ **DO:**
- Start with exploratory questions ("How does auth work?")
- Use custom slash commands for repetitive tasks
- Let Claude run tests after code changes
- Provide clear, specific instructions
- Use `/clear` between unrelated tasks

❌ **DON'T:**
- Ask Claude to do everything at once
- Skip reviewing generated code
- Forget to regenerate API client after backend changes
- Disable safety checks without good reason
- Mix multiple unrelated tasks in one conversation

## Learning More

- Read `CLAUDE.md` - comprehensive project context
- Explore `.claude/commands/` - see how commands work
- Check official docs: https://claude.ai/code
- Ask Claude: "What can you help me with in this project?"

---

**Happy coding with Claude!** 🚀

Remember: Claude is most effective when you provide clear context and iterate on solutions together.

