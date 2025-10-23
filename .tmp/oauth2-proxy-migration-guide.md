# OAuth2-Proxy Migration Guide

This guide documents the changes needed to migrate from JWT authentication to OAuth2-proxy.

## Current Status

### ✅ Completed

1. **Backend Authentication Support** (Commit: b9c1fd4)
   - Updated User model with OAuth fields (`oauth_provider`, `external_id`)
   - Made `hashed_password` nullable for OAuth users
   - Added `UserCreateFromOAuth` model
   - Added AUTH_MODE configuration (jwt|oauth2-proxy|hybrid)
   - Implemented `get_current_user_from_headers()` for header-based auth
   - Implemented `get_current_user_hybrid()` for supporting both methods
   - Auto-create users from OAuth headers on first login

2. **Database Migration**
   - Created Alembic migration to add OAuth fields
   - Migration file: `backend/alembic/versions/001_add_oauth_fields.py`

3. **Kubernetes Base Configurations**
   - OAuth2-proxy ConfigMap template
   - OAuth2-proxy Secret template with provider examples

### 🚧 Remaining Tasks

## 1. Update Backend Deployment with Sidecar

**File:** `k8s/base/backend-deployment.yaml`

Add oauth2-proxy sidecar container:

```yaml
spec:
  template:
    spec:
      containers:
      # Existing backend container
      - name: backend
        # ... existing config ...
        env:
        # Add AUTH_MODE to enable OAuth
        - name: AUTH_MODE
          value: "oauth2-proxy"  # or "hybrid" for migration

      # New oauth2-proxy sidecar
      - name: oauth2-proxy
        image: quay.io/oauth2-proxy/oauth2-proxy:v7.6.0
        args:
          - --config=/etc/oauth2-proxy/oauth2_proxy.cfg
          - --provider=$(OAUTH_PROVIDER)
          - --client-id=$(OAUTH_CLIENT_ID)
          - --client-secret=$(OAUTH_CLIENT_SECRET)
          - --cookie-secret=$(COOKIE_SECRET)
          - --redirect-url=$(REDIRECT_URL)
          # Provider-specific args
          - --oidc-issuer-url=$(OIDC_ISSUER_URL)  # For Keycloak/OIDC
        ports:
          - name: proxy
            containerPort: 4180
        env:
          # Provider selection (set via overlay)
          - name: OAUTH_PROVIDER
            valueFrom:
              secretKeyRef:
                name: oauth2-proxy-secret
                key: provider

          # Common OAuth credentials
          - name: OAUTH_CLIENT_ID
            valueFrom:
              secretKeyRef:
                name: oauth2-proxy-secret
                key: client-id

          - name: OAUTH_CLIENT_SECRET
            valueFrom:
              secretKeyRef:
                name: oauth2-proxy-secret
                key: client-secret

          - name: COOKIE_SECRET
            valueFrom:
              secretKeyRef:
                name: oauth2-proxy-secret
                key: cookie-secret

          # Redirect URL (override in overlays)
          - name: REDIRECT_URL
            value: "https://your-app.example.com/oauth2/callback"

          # OIDC-specific (for Keycloak)
          - name: OIDC_ISSUER_URL
            valueFrom:
              secretKeyRef:
                name: oauth2-proxy-secret
                key: oidc-issuer-url
                optional: true

        volumeMounts:
          - name: oauth2-proxy-config
            mountPath: /etc/oauth2-proxy

        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"

        livenessProbe:
          httpGet:
            path: /ping
            port: 4180
          initialDelaySeconds: 10
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /ping
            port: 4180
          initialDelaySeconds: 5
          periodSeconds: 5

      volumes:
        - name: oauth2-proxy-config
          configMap:
            name: oauth2-proxy-config
```

## 2. Update Backend Service

**File:** `k8s/base/backend-service.yaml`

Update service to point to oauth2-proxy port:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 4180  # Changed from 8000 to proxy port
    - name: backend-direct  # Keep direct access for debugging
      protocol: TCP
      port: 8000
      targetPort: 8000
```

## 3. Create Provider-Specific Overlays

### Keycloak Overlay

**File:** `k8s/overlays/keycloak/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: patternfly-fastapi-keycloak

resources:
  - ../../base

secretGenerator:
  - name: oauth2-proxy-secret
    literals:
      - provider=oidc
      - client-id=patternfly-fastapi
      - client-secret=YOUR_KEYCLOAK_CLIENT_SECRET
      - cookie-secret=GENERATE_WITH_PYTHON_SECRETS
      - oidc-issuer-url=https://keycloak.example.com/realms/myrealm

patchesStrategicMerge:
  - backend-deployment-patch.yaml

configMapGenerator:
  - name: oauth2-proxy-config
    behavior: merge
    literals:
      - redirect_url=https://your-app.example.com/oauth2/callback
```

### Google Overlay

**File:** `k8s/overlays/google/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: patternfly-fastapi-google

resources:
  - ../../base

secretGenerator:
  - name: oauth2-proxy-secret
    literals:
      - provider=google
      - client-id=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
      - client-secret=YOUR_GOOGLE_CLIENT_SECRET
      - cookie-secret=GENERATE_WITH_PYTHON_SECRETS
```

### GitHub Overlay

**File:** `k8s/overlays/github/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: patternfly-fastapi-github

resources:
  - ../../base

secretGenerator:
  - name: oauth2-proxy-secret
    literals:
      - provider=github
      - client-id=YOUR_GITHUB_CLIENT_ID
      - client-secret=YOUR_GITHUB_CLIENT_SECRET
      - cookie-secret=GENERATE_WITH_PYTHON_SECRETS
```

## 4. Frontend Changes

### Remove Login Component

**Files to delete:**
- `frontend/src/app/Login/Login.tsx`

**Files to modify:**

**`frontend/src/app/routeConfig.tsx`:**
Remove login route:
```typescript
// Remove this route
{
  label: 'Login',
  path: '/login',
  component: Login,
},
```

### Update AuthContext

**File:** `frontend/src/contexts/AuthContext.tsx`

```typescript
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch current user from API (authenticated via OAuth2-proxy headers).
   */
  const fetchCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  /**
   * Initialize authentication state on mount.
   */
  useEffect(() => {
    const initAuth = async () => {
      // In OAuth mode, user is always authenticated if they can access the page
      await fetchCurrentUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Logout: redirect to oauth2-proxy logout URL
   */
  const logout = () => {
    // OAuth2-proxy logout endpoint
    window.location.href = '/oauth2/sign_out?rd=/';
  };

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    logout,
    refreshUser: fetchCurrentUser,
    // Remove login and register functions
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Update ProtectedRoute

**File:** `frontend/src/components/ProtectedRoute.tsx`

```typescript
/**
 * Protected route component.
 *
 * In OAuth2-proxy mode, all routes are protected at the proxy level.
 * This component mainly handles loading states and user context.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // In OAuth2-proxy mode, if we reach here, user is authenticated
  // OAuth2-proxy handles redirects to login
  return <>{children}</>;
};
```

### Remove API Token Management

**File:** `frontend/src/api/client.ts`

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove token interceptor - OAuth2-proxy handles authentication via headers

// Keep error handling for 401/403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Redirect to OAuth2-proxy login
      window.location.href = '/oauth2/start?rd=' + encodeURIComponent(window.location.pathname);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 5. Local Development Setup

### Docker Compose for OAuth2-Proxy

**File:** `docker-compose.oauth.yml`

```yaml
version: '3.8'

services:
  oauth2-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy:v7.6.0
    command:
      - --provider=github  # or google, oidc
      - --client-id=${OAUTH_CLIENT_ID}
      - --client-secret=${OAUTH_CLIENT_SECRET}
      - --cookie-secret=${COOKIE_SECRET}
      - --email-domain=*
      - --upstream=http://backend:8000
      - --http-address=0.0.0.0:4180
      - --redirect-url=http://localhost:4180/oauth2/callback
      - --pass-user-headers=true
    ports:
      - "4180:4180"
    depends_on:
      - backend
    environment:
      OAUTH_CLIENT_ID: ${OAUTH_CLIENT_ID}
      OAUTH_CLIENT_SECRET: ${OAUTH_CLIENT_SECRET}
      COOKIE_SECRET: ${COOKIE_SECRET}

  backend:
    # ... existing backend config ...
    environment:
      - AUTH_MODE=oauth2-proxy
```

### Makefile Updates

**File:** `Makefile`

Add OAuth development targets:

```makefile
dev-oauth: ## Run development with OAuth2-proxy
	@echo "Starting services with OAuth2-proxy..."
	docker-compose -f docker-compose.yml -f docker-compose.oauth.yml up

dev-oauth-background: ## Run OAuth2-proxy in background
	docker-compose -f docker-compose.yml -f docker-compose.oauth.yml up -d
```

## 6. Environment Variable Updates

### Backend `.env.example`

Add to `backend/.env.example`:

```bash
# Authentication Mode
# Options: jwt (default), oauth2-proxy, hybrid
AUTH_MODE=jwt

# OAuth2-Proxy Header Configuration
OAUTH2_PROXY_USER_HEADER=X-Forwarded-User
OAUTH2_PROXY_EMAIL_HEADER=X-Forwarded-Email
OAUTH2_PROXY_GROUPS_HEADER=X-Forwarded-Groups
OAUTH2_PROXY_PREFERRED_USERNAME_HEADER=X-Forwarded-Preferred-Username
```

### Root `.env.example`

Add OAuth configuration section:

```bash
# ========================================
# OAuth2-Proxy Configuration (Optional)
# ========================================

# OAuth Provider (github, google, oidc, etc.)
OAUTH_PROVIDER=github

# OAuth Client Credentials (from your OAuth provider)
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# Cookie Secret (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
COOKIE_SECRET=generate-a-secure-random-value

# OIDC Configuration (for Keycloak/Red Hat SSO)
OIDC_ISSUER_URL=https://keycloak.example.com/realms/myrealm
```

## 7. Documentation Updates

### CLAUDE.md Updates

Add OAuth2-proxy section:

```markdown
## Authentication Modes

This application supports multiple authentication modes:

### JWT Mode (Default)
Traditional JWT token-based authentication. Users log in with email/password.

```bash
AUTH_MODE=jwt
make dev
```

### OAuth2-Proxy Mode
External OAuth provider authentication (Keycloak, Google, GitHub).

```bash
AUTH_MODE=oauth2-proxy
make dev-oauth
```

### Hybrid Mode
Supports both JWT and OAuth2-proxy (useful during migration).

```bash
AUTH_MODE=hybrid
make dev
```

## OAuth Provider Setup

### Keycloak/Red Hat SSO
1. Create a new client in Keycloak
2. Set redirect URI: `https://your-app.example.com/oauth2/callback`
3. Enable "Client authentication"
4. Copy client ID and secret
5. Update `k8s/overlays/keycloak/kustomization.yaml`

### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-app.example.com/oauth2/callback`
4. Copy client ID and secret
5. Update `k8s/overlays/google/kustomization.yaml`

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set callback URL: `https://your-app.example.com/oauth2/callback`
4. Copy client ID and secret
5. Update `k8s/overlays/github/kustomization.yaml`
```

## Migration Checklist

- [ ] Run database migration: `make db-init` or `alembic upgrade head`
- [ ] Update backend deployment with sidecar configuration
- [ ] Create OAuth provider credentials (Keycloak/Google/GitHub)
- [ ] Update Kubernetes secrets with OAuth credentials
- [ ] Deploy with appropriate overlay: `make deploy -f k8s/overlays/keycloak`
- [ ] Test OAuth login flow
- [ ] Update frontend to remove login UI
- [ ] Update documentation
- [ ] Test user auto-creation
- [ ] Verify existing JWT users still work in hybrid mode
- [ ] Switch to oauth2-proxy mode once migration complete
- [ ] Remove JWT dependencies if no longer needed

## Testing Strategy

1. **Local Development Testing**
   - Run with docker-compose OAuth setup
   - Test each provider (GitHub for dev, Google for testing)
   - Verify user auto-creation

2. **Staging/Dev Cluster Testing**
   - Deploy with hybrid mode
   - Test both JWT and OAuth flows
   - Verify header extraction

3. **Production Deployment**
   - Deploy with oauth2-proxy mode
   - Monitor user creation
   - Have rollback plan ready (switch to jwt mode)

## Troubleshooting

### OAuth2-Proxy Not Passing Headers
Check logs: `kubectl logs deployment/backend -c oauth2-proxy`
Verify `pass_user_headers = true` in config

### Users Not Auto-Creating
Check backend logs for header values
Verify `AUTH_MODE=oauth2-proxy` or `hybrid`
Check database permissions

### Cookie Issues
Ensure `cookie_secure = true` only in HTTPS environments
Check cookie domain settings in overlay

## Additional Resources

- OAuth2-Proxy Documentation: https://oauth2-proxy.github.io/oauth2-proxy/
- Keycloak Documentation: https://www.keycloak.org/docs/latest/
- Google OAuth Setup: https://developers.google.com/identity/protocols/oauth2
- GitHub OAuth Apps: https://docs.github.com/en/developers/apps/building-oauth-apps
