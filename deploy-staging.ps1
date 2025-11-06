# Delorme OS - Easy Staging Deployment Script
# This script automates the deployment to Render.com

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Delorme OS - Staging Deployment Helper                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Git
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitInstalled) {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git installed" -ForegroundColor Green

# Check if in git repository
$isGitRepo = Test-Path .git
if (-not $isGitRepo) {
    Write-Host "❌ Not in a git repository. Please run from project root." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git repository detected" -ForegroundColor Green

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Cyan

# Check if remote exists
$remotes = git remote -v
if (-not $remotes) {
    Write-Host "❌ No git remote configured. Please add GitHub remote first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ GitHub remote configured" -ForegroundColor Green
Write-Host ""

# Check for Render CLI
Write-Host "Checking for Render CLI..." -ForegroundColor Yellow
$renderInstalled = Get-Command render -ErrorAction SilentlyContinue

if (-not $renderInstalled) {
    Write-Host "❌ Render CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Would you like to install Render CLI? (Recommended)" -ForegroundColor Yellow
    Write-Host "This enables easy deployment from command line." -ForegroundColor Yellow
    Write-Host ""
    $install = Read-Host "Install Render CLI? (y/n)"

    if ($install -eq 'y' -or $install -eq 'Y') {
        Write-Host ""
        Write-Host "Installing Render CLI..." -ForegroundColor Yellow
        npm install -g @render-com/cli

        $renderInstalled = Get-Command render -ErrorAction SilentlyContinue
        if ($renderInstalled) {
            Write-Host "✅ Render CLI installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install Render CLI" -ForegroundColor Red
            Write-Host "Please install manually: npm install -g @render-com/cli" -ForegroundColor Yellow
        }
    }
}

if ($renderInstalled) {
    Write-Host "✅ Render CLI available" -ForegroundColor Green
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Show deployment options
Write-Host "Choose your deployment method:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 🌐 Open Render Blueprint (One-Click Deploy)" -ForegroundColor Green
Write-Host "   → Opens browser to deploy from GitHub with render.yaml"
Write-Host "   → Easiest method, ~5 minutes"
Write-Host ""
Write-Host "2. 🚀 Deploy via Render CLI (Power User)" -ForegroundColor Yellow
Write-Host "   → Uses Render CLI to deploy from command line"
Write-Host "   → Requires Render CLI login"
Write-Host ""
Write-Host "3. 📝 Show deployment guide" -ForegroundColor Cyan
Write-Host "   → Opens DEPLOY_STAGING_NOW.md with full instructions"
Write-Host ""
Write-Host "4. ❌ Exit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Opening Render Blueprint..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Instructions:" -ForegroundColor Yellow
        Write-Host "1. Authorize Render to access GitHub" -ForegroundColor White
        Write-Host "2. Select repository: delormeca/velocity-app" -ForegroundColor White
        Write-Host "3. Select branch: staging" -ForegroundColor White
        Write-Host "4. Configure secrets (see DEPLOY_STAGING_NOW.md)" -ForegroundColor White
        Write-Host "5. Click 'Apply' to deploy!" -ForegroundColor White
        Write-Host ""
        Start-Sleep -Seconds 2
        Start-Process "https://dashboard.render.com/select-repo?type=blueprint"

        # Also open the guide
        Write-Host "Opening deployment guide for reference..." -ForegroundColor Cyan
        Start-Sleep -Seconds 1
        if (Test-Path ".\DEPLOY_STAGING_NOW.md") {
            Start-Process ".\DEPLOY_STAGING_NOW.md"
        }
    }

    "2" {
        if (-not $renderInstalled) {
            Write-Host ""
            Write-Host "❌ Render CLI is not installed." -ForegroundColor Red
            Write-Host "Please choose option 1 for browser deployment, or install CLI:" -ForegroundColor Yellow
            Write-Host "npm install -g @render-com/cli" -ForegroundColor White
            exit 1
        }

        Write-Host ""
        Write-Host "Deploying via Render CLI..." -ForegroundColor Green
        Write-Host ""

        # Check if logged in
        Write-Host "Checking Render authentication..." -ForegroundColor Yellow
        $authCheck = render auth whoami 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Not logged in to Render" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please log in first:" -ForegroundColor Yellow
            Write-Host "  render login" -ForegroundColor White
            Write-Host ""
            $login = Read-Host "Would you like to log in now? (y/n)"

            if ($login -eq 'y' -or $login -eq 'Y') {
                render login

                if ($LASTEXITCODE -ne 0) {
                    Write-Host "❌ Login failed" -ForegroundColor Red
                    exit 1
                }
            } else {
                exit 1
            }
        }

        Write-Host "✅ Authenticated with Render" -ForegroundColor Green
        Write-Host ""

        # Ensure we're on staging branch
        if ($currentBranch -ne "staging") {
            Write-Host "⚠️  Not on staging branch" -ForegroundColor Yellow
            Write-Host "Switching to staging branch..." -ForegroundColor Yellow
            git checkout staging
        }

        # Push latest changes
        Write-Host "Pushing latest changes to GitHub..." -ForegroundColor Cyan
        git push origin staging

        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
            exit 1
        }

        Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
        Write-Host ""

        # Deploy using blueprint
        Write-Host "Deploying with Render Blueprint..." -ForegroundColor Cyan
        render blueprint launch

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
            Write-Host "✅ Deployment initiated successfully!" -ForegroundColor Green
            Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
            Write-Host ""
            Write-Host "🚀 Your staging environment is being deployed!" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Monitor deployment: https://dashboard.render.com" -ForegroundColor White
            Write-Host "2. Set up secrets in Render Dashboard (see DEPLOY_STAGING_NOW.md)" -ForegroundColor White
            Write-Host "3. Test your app when deployment completes (~10-15 minutes)" -ForegroundColor White
            Write-Host ""

            $openDashboard = Read-Host "Open Render Dashboard? (y/n)"
            if ($openDashboard -eq 'y' -or $openDashboard -eq 'Y') {
                Start-Process "https://dashboard.render.com"
            }
        } else {
            Write-Host "❌ Deployment failed" -ForegroundColor Red
            Write-Host "Please check the error above or try Option 1 (Browser deployment)" -ForegroundColor Yellow
        }
    }

    "3" {
        Write-Host ""
        Write-Host "Opening deployment guide..." -ForegroundColor Cyan
        if (Test-Path ".\DEPLOY_STAGING_NOW.md") {
            Start-Process ".\DEPLOY_STAGING_NOW.md"
        } else {
            Write-Host "❌ DEPLOY_STAGING_NOW.md not found" -ForegroundColor Red
        }
    }

    "4" {
        Write-Host ""
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }

    default {
        Write-Host ""
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "For support, see:" -ForegroundColor Yellow
Write-Host "  - DEPLOY_STAGING_NOW.md" -ForegroundColor White
Write-Host "  - QUICK_START_RENDER.md" -ForegroundColor White
Write-Host "  - https://render.com/docs" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
