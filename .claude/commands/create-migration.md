# Create Database Migration

Create an Alembic migration for database schema changes.

**Arguments**: `$ARGUMENTS` - Migration description (e.g., "add email_verified column to users table")

## Steps:

1. **Make Model Changes First**
   - Edit `app/models.py`
   - Update SQLModel class with new fields/tables
   - Add proper types, Field() definitions, relationships

2. **Create Migration**
   ```bash
   task db:migrate-create -- "$ARGUMENTS"
   ```
   
   This generates a new file in `migrations/versions/` with timestamp

3. **Review Generated Migration**
   - Open the generated migration file
   - Verify `upgrade()` function has correct changes
   - Verify `downgrade()` function can rollback
   - Check for data migration needs

4. **Add Data Migrations** (if needed)
   - Add `op.execute()` commands in upgrade()
   - Handle existing data transformation
   - Example:
     ```python
     # Set default values for existing rows
     op.execute("UPDATE users SET email_verified = false WHERE email_verified IS NULL")
     ```

5. **Test Migration**
   ```bash
   # Apply migration
   task db:migrate-up
   
   # Verify database schema
   poetry run python -c "from app.db import engine; from sqlmodel import select; print('Migration successful!')"
   
   # Test rollback (optional)
   task db:migrate-down
   task db:migrate-up
   ```

6. **Update Related Code**
   - Update Pydantic schemas if needed
   - Update services that use the model
   - Regenerate API client: `task frontend:generate-client`

## Common Migration Patterns:

### Add Column:
```python
op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=True))
```

### Add Column with Default:
```python
op.add_column('users', sa.Column('role', sa.String(), server_default='user'))
```

### Add Foreign Key:
```python
op.add_column('articles', sa.Column('category_id', sa.UUID()))
op.create_foreign_key('fk_articles_category', 'articles', 'categories', ['category_id'], ['id'])
```

### Create Table:
```python
op.create_table(
    'categories',
    sa.Column('id', sa.UUID(), primary_key=True),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False)
)
```

## Important Notes:

- **ALWAYS review** auto-generated migrations before applying
- **Test rollback** works correctly
- **Handle existing data** when adding non-nullable columns
- **Use server_default** for new required columns
- **Document complex migrations** with comments in the migration file

## Troubleshooting:

If migration fails:
```bash
# Check current revision
poetry run alembic current

# Check migration history
poetry run alembic history

# Manually rollback if needed
poetry run alembic downgrade -1

# Reset to specific revision
poetry run alembic downgrade <revision_id>
```

