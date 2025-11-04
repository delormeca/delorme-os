# dev.py Script Usage Guide

The `dev.py` script provides a convenient way to run common development and deployment tasks.

## 🔧 **Usage Patterns**

### **Local Development**
```bash
# ✅ CORRECT - Use poetry run for local development
poetry run python dev.py server
poetry run python dev.py migrate
poetry run python dev.py create-super
poetry run python dev.py test-config
```

**Why Poetry is needed locally:**
- Dependencies are in Poetry's virtual environment
- Direct `python` can't access project dependencies
- Ensures consistent dependency versions

### **Production/Docker Deployment**
```bash
# ✅ CORRECT - Direct python in production containers
python dev.py server
python dev.py migrate  
python dev.py create-super
python dev.py test-config

# Or via deployment platform CLIs:
railway run python dev.py test-config
docker exec container python dev.py test-config
```

**Why direct python works in production:**
- Dockerfile: `poetry config virtualenvs.create false`
- Dependencies installed globally in container
- No virtual environment isolation needed

## 🎯 **Quick Reference**

| Context | Command Pattern | Reason |
|---------|----------------|---------|
| **Local Dev** | `poetry run python dev.py <cmd>` | Virtual environment |
| **Docker** | `python dev.py <cmd>` | Global dependencies |
| **Railway CLI** | `railway run python dev.py <cmd>` | Container context |
| **Production** | `python dev.py <cmd>` | Deployed environment |

## 📋 **Available Commands**

```bash
# Show help
poetry run python dev.py  # (local)
python dev.py             # (production)

# Available commands:
server            # Start development server
migrate           # Run database migrations  
create-super      # Create superuser account
setup-payments    # Setup payment integration
test-config       # Test configuration loading
```

## ⚠️ **Common Mistakes**

```bash
# ❌ WRONG - Direct python in local development
python dev.py server
# Error: No module named 'pydantic_settings'

# ❌ WRONG - Poetry run in production scripts
# (Unnecessary overhead, but usually works)
poetry run python dev.py server  # in production
```

## 🔄 **Context Detection**

The script automatically detects the environment and loads the appropriate configuration, but the execution context (Poetry vs direct Python) depends on how dependencies are installed in your current environment.
