# Environment Variables Guide - NOVAKINETIX ACADEMY

## 🔧 Required Environment Variables

### **Supabase Configuration (Required)**
```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

# Supabase Anonymous Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (Private - for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **Application Configuration (Required)**
```bash
# Main application URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Site URL for email links
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### **Email Configuration (Required for Email)**
```bash
# Email Server Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false

# Email Account Credentials
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com
```

## 🔧 Local Development (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com
```

## 🔧 Vercel Production

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com
```

## 🔧 How to Set Up Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a new password
3. **Use the generated password** in your `MAIL_PASSWORD` environment variable

## 🔧 Vercel Environment Variables Setup

1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add each variable with the appropriate environment:
   - **Production**: For live site
   - **Preview**: For pull request deployments
   - **Development**: For local development

## 🔧 Testing Your Configuration

After setting up environment variables, test them:

```bash
# Test Flask Mail service health
curl https://your-domain.vercel.app/api/email/health

# Test email templates
curl https://your-domain.vercel.app/api/email/templates

# Run system validation
node scripts/system-validation.js
```

## 🚨 Important Notes

- **Never commit sensitive environment variables** to version control
- **Use app passwords** for Gmail instead of regular passwords
- **Enable 2FA** on your email account for security
- **Test email functionality** after deployment
- **Update URLs** if you change your domain

## 📋 Quick Checklist

- [ ] Supabase project created and configured
- [ ] Gmail app password generated
- [ ] Environment variables set in Vercel
- [ ] Email service tested and working
- [ ] Database connection verified
- [ ] System validation script passes

---

**Last Updated**: July 2024 