## Description

Brief description of what this PR does.

Fixes #(issue_number)

## What Type of PR Is This?

- [ ] ✨ Feature
- [ ] 🐛 Bug Fix
- [ ] 📝 Documentation
- [ ] ♻️ Refactor
- [ ] ⚡ Performance
- [ ] ✅ Test
- [ ] 🔧 CI/CD
- [ ] 🎨 Style/UI

## Screenshots (if applicable)

Add screenshots or recordings to demonstrate UI changes.

## Testing

### How I Tested This

Describe your testing approach:

```bash
# Commands used for testing
pnpm install
pnpm -r lint
pnpm -r typecheck  
pnpm -r test
pnpm --filter frontend run dev
pnpm --filter react-component-editor-backend run dev
```

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Manual testing completed

## Database Changes

### Migrations Required?

- [ ] No database changes
- [ ] Yes - migration required (describe below)

### Migration Details (if applicable)

```sql
-- Add migration SQL or Prisma schema changes here
```

### Rollback Plan

```sql
-- Add rollback SQL if needed
```

## Environment Variables

### New Environment Variables

- [ ] No new environment variables
- [ ] Yes - new variables added (list below WITHOUT values)

### Environment Variable List (if applicable)

```
VARIABLE_NAME - Description (stored in AWS SSM/Secrets Manager)
```

## AWS Deployment Impact

### Services Affected

- [ ] No AWS changes required
- [ ] Lambda functions
- [ ] API Gateway
- [ ] RDS/Database
- [ ] S3 buckets
- [ ] CloudFront
- [ ] Other: (specify)

### Deployment Steps

1. Pre-deployment checks
2. Deploy to staging
3. Run smoke tests
4. Deploy to production
5. Monitor CloudWatch logs

### Rollback Strategy

Describe how to rollback if issues arise:

## Performance Impact

- [ ] No performance impact
- [ ] Improved performance (describe)
- [ ] Potential performance impact (describe mitigation)

## Security Checklist

- [ ] No hardcoded secrets or API keys
- [ ] Environment variables used for sensitive data
- [ ] Input validation implemented
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention (if applicable)
- [ ] Authentication/authorization properly handled
- [ ] Sensitive data encrypted in transit and at rest

## Documentation

- [ ] Code comments added for complex logic
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] PoC document created/updated (link if applicable)

## Pre-Merge Checklist

- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
- [ ] I have checked my code for any leftover debugging statements
- [ ] No console.log() statements left in production code
- [ ] This PR follows the project's coding standards

