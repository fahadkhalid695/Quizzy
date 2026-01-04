# Security & Best Practices Guide

## 🔐 Security Implementation Checklist

### Authentication & Authorization
- [x] Password hashing with bcryptjs (10 salt rounds)
- [x] JWT tokens for session management
- [x] Protected API routes with role verification
- [ ] Password reset functionality (needs implementation)
- [ ] Email verification for registration (needs implementation)
- [ ] Account lockout after failed attempts (needs implementation)
- [ ] Session timeout handling (needs implementation)
- [ ] Refresh token rotation (needs implementation)

### Data Protection
- [ ] HTTPS/TLS for all communications
- [ ] Database encryption at rest
- [ ] Field-level encryption for sensitive data (PII)
- [ ] Secure password storage policy
- [ ] Data minimization (only collect needed data)
- [ ] Regular backups with encryption
- [ ] GDPR compliance (data deletion)

### API Security
- [ ] CORS configuration (currently open - needs refinement)
- [ ] CSRF token implementation
- [ ] Rate limiting (100 req/15 min recommended)
- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] SQL/NoSQL injection prevention
- [ ] API version management

### Infrastructure Security
- [ ] Environment variables protection (.env)
- [ ] Secrets management (not in version control)
- [ ] Secure headers configuration
- [ ] Content Security Policy (CSP)
- [ ] X-Frame-Options to prevent clickjacking
- [ ] X-Content-Type-Options for MIME sniffing
- [ ] API key rotation policy

### Frontend Security
- [ ] Input sanitization
- [ ] XSS prevention (React handles by default)
- [ ] CSRF token in forms
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] No sensitive data in localStorage
- [ ] Secure token storage (currently localStorage - not ideal)

---

## 🛡️ Critical Security Issues to Address

### HIGH Priority

1. **JWT Secret Management**
   ```javascript
   // ❌ WRONG - Using default secret
   NEXTAUTH_SECRET=your-secret-key

   // ✅ CORRECT - Generate strong random secret
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   ```

2. **Environment Variables**
   - Never commit `.env.local` to git
   - Use `.env.local.example` for templates
   - Store secrets in secure vault (AWS Secrets Manager, GitHub Secrets)

3. **Token Storage**
   - Current: localStorage (vulnerable to XSS)
   - Better: httpOnly cookies
   - Implementation needed in auth API

4. **CORS Configuration**
   ```typescript
   // Current: Too permissive
   // Add to next.config.js:
   headers: async () => [{
     source: '/api/:path*',
     headers: [
       {
         key: 'Access-Control-Allow-Origin',
         value: process.env.NEXT_PUBLIC_APP_URL
       }
     ]
   }]
   ```

5. **Rate Limiting**
   ```typescript
   // Install: npm install express-rate-limit
   // Use in API routes to prevent abuse
   const rateLimit = require('express-rate-limit')
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   })
   ```

### MEDIUM Priority

6. **Input Validation**
   - Validate all user inputs
   - Use Zod or Joi for schema validation
   - Sanitize before database operations

7. **Error Handling**
   - Don't expose stack traces to clients
   - Log errors securely server-side
   - Return generic error messages

8. **Database Security**
   - Create database user with minimal permissions
   - Enable MongoDB authentication
   - Use connection string with encrypted password

9. **API Key Protection**
   - Gemini API key in .env (never in code)
   - Implement API key rotation
   - Monitor usage for abuse

10. **Logging & Monitoring**
    - Log security events
    - Monitor suspicious activities
    - Set up alerts for anomalies

### LOW Priority

11. **Performance Security**
    - Enable compression
    - Minify JavaScript
    - Optimize database queries

12. **Compliance**
    - GDPR data handling
    - Student data privacy
    - Terms of service
    - Privacy policy

---

## 🔒 Security Implementation Examples

### Secure Cookie Setup
```typescript
// In next.config.js
const withSecureHeaders = require('next-secure-headers')

module.exports = withSecureHeaders({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  xssProtection: '1; mode=block',
})
```

### Input Validation with Zod
```typescript
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = registerSchema.safeParse(body)
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    )
  }
  
  // Proceed with validated data
}
```

### Secure Error Handling
```typescript
export async function handleError(error: any) {
  // Log full error server-side
  console.error('[ERROR]', error)
  
  // Return generic message to client
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  )
}
```

### API Endpoint Security
```typescript
import { protectedRoute } from '@/lib/auth-middleware'

export async function DELETE(request: NextRequest) {
  // Verify user is authenticated and has correct role
  const auth = await protectedRoute(request, 'teacher')
  if (auth instanceof NextResponse) return auth
  
  // Verify user owns the resource
  const resource = await findResource(resourceId)
  if (resource.ownerId !== auth.userId) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }
  
  // Proceed safely
}
```

---

## 📋 Pre-Deployment Security Checklist

### Before Going to Production

- [ ] Change all default passwords
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Configure MongoDB with authentication
- [ ] Enable MongoDB IP whitelist
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure CORS with production domain only
- [ ] Review all environment variables
- [ ] Disable debug/development mode
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting on all endpoints
- [ ] Configure WAF (Web Application Firewall)
- [ ] Set up logging and monitoring
- [ ] Create automated backups
- [ ] Test security with OWASP ZAP
- [ ] Run dependency vulnerability check: `npm audit`
- [ ] Code review security implementations
- [ ] Legal review of terms and privacy policy
- [ ] Setup incident response plan

---

## 🚨 Common Security Vulnerabilities to Avoid

### 1. SQL/NoSQL Injection
```javascript
// ❌ VULNERABLE
const user = await User.findOne({ email: userInput })

// ✅ SAFE - Mongoose handles sanitization
// But always validate input
if (!isValidEmail(userInput)) {
  throw new Error('Invalid email')
}
```

### 2. Cross-Site Scripting (XSS)
```javascript
// ❌ VULNERABLE
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ SAFE - React escapes by default
<div>{userContent}</div>
```

### 3. Cross-Site Request Forgery (CSRF)
```javascript
// ✅ SAFE - Use SameSite cookies
Set-Cookie: token=...; SameSite=Strict; HttpOnly
```

### 4. Insecure Direct Object References (IDOR)
```javascript
// ❌ VULNERABLE - No ownership check
const test = await Test.findById(req.params.id)

// ✅ SAFE - Verify ownership
const test = await Test.findOne({
  _id: req.params.id,
  teacherId: auth.userId
})
```

### 5. Authentication Bypass
```javascript
// ✅ SAFE - Always verify tokens
export async function protectedRoute(request, role) {
  const token = extractToken(request)
  const decoded = await verifyToken(token)
  
  if (!decoded) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
```

---

## 📞 Security Resources

### Tools & Services
- **Dependency Check**: `npm audit`
- **OWASP ZAP**: Security testing
- **Snyk**: Vulnerability scanning
- **GitHub Security**: Dependabot alerts
- **MongoDB Atlas**: Secure database hosting

### Learning Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [MDN Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Compliance
- GDPR (EU data protection)
- FERPA (Student records - US)
- CCPA (California privacy)
- COPPA (Children's online privacy - US)

---

## 🔄 Ongoing Security Maintenance

### Monthly
- Review security logs
- Check for vulnerability reports
- Update dependencies
- Audit access controls

### Quarterly
- Penetration testing
- Security code review
- Update security policies
- Train team on security

### Annually
- Full security audit
- Compliance verification
- Disaster recovery testing
- Security policy review

---

## ⚠️ Incident Response Procedure

1. **Detect**: Monitor logs and alerts
2. **Isolate**: Disable compromised accounts/systems
3. **Investigate**: Determine breach scope
4. **Fix**: Patch vulnerabilities
5. **Restore**: Bring systems back online
6. **Notify**: Inform affected users (within legal requirements)
7. **Review**: Post-incident analysis

---

**Remember: Security is not a feature, it's a requirement!**

Last Updated: January 4, 2026
