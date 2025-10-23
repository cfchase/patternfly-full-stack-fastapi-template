# OAuth2-Proxy Migration Summary

**Branch:** `feature/oauth2-proxy-migration`

## Overview

This branch implements foundational support for OAuth2-proxy authentication, allowing the application to use external OAuth providers (Keycloak, Google, GitHub) instead of traditional JWT authentication.

## What's Been Implemented

### ✅ Backend OAuth Support (Fully Functional)

**Commit:** `b9c1fd4` - Add OAuth2-proxy authentication support to backend

The backend now supports three authentication modes:

1. **jwt** (default) - Traditional JWT authentication with email/password
2. **oauth2-proxy** - Header-based authentication from OAuth2-proxy sidecar
3. **hybrid** - Supports both JWT and OAuth2-proxy (useful during migration)

**Key Features:**
- User model extended with OAuth fields (`oauth_provider`, `external_id`)
- Password field made nullable for OAuth users
- Auto-creates users from OAuth headers on first login
- Extracts user info from X-Forwarded-Email, X-Forwarded-User headers
- Configurable via `AUTH_MODE` environment variable
- Backward compatible - JWT authentication still works

**Files Modified:**
- `backend/app/models.py` - Added OAuth fields and UserCreateFromOAuth model
- `backend/app/core/config.py` - Added AUTH_MODE and OAuth header configuration
- `backend/app/api/deps.py` - Implemented header-based authentication

### ✅ Database Migration

**Commit:** `9ebace0` - Add OAuth2-proxy infrastructure and migration guide

**File:** `backend/alembic/versions/001_add_oauth_fields.py`

Migration adds:
- `oauth_provider` VARCHAR(50) NULL - Tracks which OAuth provider was used
- `external_id` VARCHAR(255) NULL - Stores provider's user ID
- Makes `hashed_password` nullable for OAuth users

### ✅ Kubernetes Base Configurations

**Files Created:**
- `k8s/base/oauth2-proxy-config.yaml` - ConfigMap with OAuth2-proxy settings
- `k8s/base/oauth2-proxy-secret.yaml.example` - Secret template for all providers

**Configuration Highlights:**
- Passes user headers to backend (X-Forwarded-User, X-Forwarded-Email)
- Exempts health check endpoint from authentication
- Secure cookie configuration (HttpOnly, Secure, SameSite)
- 7-day session duration
- Support for Keycloak/OIDC, Google, and GitHub

## Detailed Migration Guide

A comprehensive migration guide has been created at:
**`.tmp/oauth2-proxy-migration-guide.md`**

This guide includes:
- Complete Kubernetes deployment with sidecar pattern
- Provider-specific overlay examples (Keycloak, Google, GitHub)
- Frontend changes needed
- Local development setup with Docker Compose
- Step-by-step migration checklist
- Testing strategy
- Troubleshooting tips

## How to Use (Testing)

### Test Backend OAuth Support Locally

1. **Start the backend in OAuth mode:**
   ```bash
   cd backend
   AUTH_MODE=oauth2-proxy uv run uvicorn main:app --reload
   ```

2. **Simulate OAuth2-proxy headers:**
   ```bash
   curl -H "X-Forwarded-Email: user@example.com" \
        -H "X-Forwarded-User: user@example.com" \
        http://localhost:8000/api/v1/users/me
   ```

3. **User will be auto-created** in the database on first request

### Test Hybrid Mode (Migration)

```bash
AUTH_MODE=hybrid uv run uvicorn main:app --reload
```

Now you can use either:
- JWT authentication (Authorization: Bearer header)
- OAuth2-proxy headers (X-Forwarded-Email, etc.)

## What's NOT Yet Implemented

The following tasks are documented in the migration guide but not yet coded:

### 1. Kubernetes Sidecar Deployment
- Need to update `k8s/base/backend-deployment.yaml` to add oauth2-proxy sidecar container
- Need to update `k8s/base/backend-service.yaml` to route through proxy port
- Need to create provider-specific overlays (keycloak, google, github)

### 2. Frontend Changes
- Remove Login component and route
- Update AuthContext to use OAuth logout URL
- Remove JWT token management from API client
- Update ProtectedRoute component

### 3. Local Development Setup
- Create `docker-compose.oauth.yml` for local OAuth testing
- Add Makefile targets for OAuth development
- Update `.env.example` files with OAuth configuration

### 4. Documentation
- Update main README with OAuth instructions
- Update CLAUDE.md with authentication modes
- Create provider setup guides

## Migration Strategy

### Phase 1: Enable Hybrid Mode (Recommended)
1. Deploy backend with `AUTH_MODE=hybrid`
2. Existing JWT users continue to work
3. New OAuth users can be created
4. Test OAuth flow with real providers
5. Gradually migrate users to OAuth

### Phase 2: Pure OAuth Mode
1. Once all users migrated, switch to `AUTH_MODE=oauth2-proxy`
2. Remove JWT dependencies if desired
3. Clean up unused password fields

### Phase 3: Frontend Updates
1. Remove login UI components
2. Simplify authentication context
3. Update user management pages

## Testing Checklist

- [x] Backend accepts OAuth headers
- [x] Auto-creates users from headers
- [x] Handles missing headers gracefully
- [x] Hybrid mode supports both auth methods
- [x] Database migration created
- [ ] OAuth2-proxy sidecar deployment works
- [ ] Keycloak provider tested
- [ ] Google provider tested
- [ ] GitHub provider tested
- [ ] Frontend logout works with OAuth
- [ ] User sessions persist correctly
- [ ] Health check endpoint exempted from auth

## Security Considerations

### ✅ Implemented
- Headers only trusted in oauth2-proxy mode
- User auto-creation only when configured
- Inactive users blocked
- Backward compatible with JWT

### ⚠️ Important Notes
1. **Trust OAuth2-Proxy Headers**: In oauth2-proxy mode, backend trusts X-Forwarded-* headers. Ensure:
   - OAuth2-proxy is the ONLY way to access the backend
   - Network policies prevent direct backend access
   - OAuth2-proxy validates users before forwarding

2. **Cookie Security**: OAuth2-proxy cookies are:
   - HttpOnly (prevents XSS)
   - Secure (HTTPS only in production)
   - SameSite=lax (CSRF protection)

3. **Session Duration**: Default 7 days, configurable

## Next Steps

To complete the OAuth2-proxy migration:

1. **Review the migration guide**: `.tmp/oauth2-proxy-migration-guide.md`

2. **Choose your provider** and set up OAuth credentials:
   - Keycloak/Red Hat SSO
   - Google OAuth
   - GitHub OAuth

3. **Update Kubernetes deployments** following the guide

4. **Test in development** with docker-compose OAuth setup

5. **Deploy to staging** with hybrid mode

6. **Update frontend** to remove login UI

7. **Switch to oauth2-proxy mode** in production

## Questions?

Refer to:
- **Migration Guide**: `.tmp/oauth2-proxy-migration-guide.md` (comprehensive step-by-step)
- **OAuth2-Proxy Docs**: https://oauth2-proxy.github.io/oauth2-proxy/
- **Code Comments**: See `backend/app/api/deps.py` for implementation details

## Branch Status

**Current State:** Foundation complete, ready for deployment configuration

**Commits:**
1. `b9c1fd4` - Backend OAuth authentication support
2. `9ebace0` - Database migration and Kubernetes base configs

**Ready For:** Kubernetes deployment updates and frontend modifications
