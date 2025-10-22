# Security Considerations

This document outlines security considerations for the PatternFly FastAPI Template, particularly regarding authentication and token storage.

## Authentication Implementation

This template uses JWT (JSON Web Tokens) for authentication with the following characteristics:

### Token Storage

**Current Implementation:** Tokens are stored in browser `localStorage`

**Location:** `frontend/src/utils/auth.ts`

```typescript
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};
```

### Security Trade-offs

#### localStorage Approach (Current)

**Pros:**
- Simple implementation
- Works across tabs/windows
- Persists across browser restarts
- Easy to implement

**Cons:**
- ⚠️ **Vulnerable to XSS (Cross-Site Scripting) attacks**
- If malicious JavaScript executes, tokens can be stolen
- Accessible to any JavaScript code on the page

**Acceptable for:**
- Development and testing
- Internal applications with trusted users
- Starter templates and prototypes
- Applications with strict CSP policies

**Not recommended for:**
- Public-facing applications
- Applications handling sensitive data
- Compliance-sensitive environments (PCI-DSS, HIPAA, etc.)

### Recommended Production Improvements

#### 1. httpOnly Cookies (Preferred for Production)

**Implementation Changes Required:**

**Backend** (`backend/app/api/routes/v1/login.py`):
```python
@router.post("/access-token")
def login_access_token(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
) -> Token:
    # ... authentication logic ...

    # Set httpOnly cookie instead of returning token in JSON
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,  # Prevents JavaScript access
        secure=True,    # HTTPS only
        samesite="lax", # CSRF protection
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"access_token": access_token, "token_type": "bearer"}
```

**Frontend** (`frontend/src/api/client.ts`):
```typescript
// Remove manual token injection - cookies sent automatically
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, // Send cookies with requests
});
```

**Benefits:**
- ✅ Immune to XSS attacks
- ✅ Token not accessible to JavaScript
- ✅ Automatic inclusion in requests

**Trade-offs:**
- Requires CSRF protection
- More complex logout implementation
- Cookie domain configuration needed

#### 2. Content Security Policy (CSP)

Add CSP headers to prevent XSS attacks:

**Backend** (`backend/app/main.py`):
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline';"
    )
    return response
```

#### 3. Token Refresh Pattern

Implement refresh tokens for better security:

- **Access token**: Short-lived (15 minutes)
- **Refresh token**: Long-lived (7 days), stored in httpOnly cookie
- Automatically refresh access tokens when they expire

#### 4. Additional Security Measures

**HTTPS Only:**
```python
# Force HTTPS in production
if settings.ENVIRONMENT == "production":
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="strict",
    )
```

**Input Validation:**
- All user inputs are validated with Pydantic
- SQL injection prevented by SQLModel/SQLAlchemy
- Password requirements enforced

**Rate Limiting:**
Add rate limiting to login endpoint (not currently implemented):
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/access-token")
@limiter.limit("5/minute")  # 5 attempts per minute
def login_access_token(...):
    ...
```

## Current Security Features

✅ **Password Hashing:** bcrypt with automatic salting
✅ **JWT Tokens:** HS256 algorithm with expiration
✅ **CORS:** Properly configured for allowed origins
✅ **Environment Variables:** Sensitive data in .env files
✅ **Input Validation:** Pydantic models validate all inputs
✅ **SQL Injection Prevention:** SQLModel ORM
✅ **Inactive User Prevention:** Inactive users cannot login

## Security Checklist for Production

Before deploying to production, ensure:

- [ ] SECRET_KEY is set to a secure random value
- [ ] SECRET_KEY is not committed to version control
- [ ] HTTPS is enforced (not HTTP)
- [ ] CORS origins are limited to production domains
- [ ] Database credentials are secure and rotated
- [ ] Consider migrating from localStorage to httpOnly cookies
- [ ] Implement CSP headers
- [ ] Add rate limiting to authentication endpoints
- [ ] Enable application logging and monitoring
- [ ] Implement account lockout after failed attempts
- [ ] Add password complexity requirements
- [ ] Implement password reset flow with email verification
- [ ] Consider implementing 2FA (Two-Factor Authentication)

## Reporting Security Issues

If you discover a security vulnerability in this template, please report it by:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Web Security Basics](https://developer.mozilla.org/en-US/docs/Web/Security)
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
