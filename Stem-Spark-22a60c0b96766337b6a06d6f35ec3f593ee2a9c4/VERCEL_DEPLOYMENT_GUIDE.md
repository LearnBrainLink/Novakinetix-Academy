# Vercel Deployment Guide - NOVAKINETIX ACADEMY

## 🚀 Overview

This guide will help you deploy the NOVAKINETIX ACADEMY Stem-Spark platform to Vercel, including both the Next.js frontend and the Flask Mail microservice.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Supabase Project**: Set up your Supabase database
4. **Email Provider**: Gmail or other SMTP provider

## 🔧 Step 1: Prepare Your Repository

### 1.1 Ensure All Files Are Present
```
Stem-Spark-22a60c0b96766337b6a06d6f35ec3f593ee2a9c4/
├── app/                          # Next.js app directory
├── components/                   # React components
├── lib/                         # Utility libraries
├── flask-mail-service/          # Flask Mail microservice
│   ├── app.py                   # Flask application
│   ├── requirements.txt         # Python dependencies
│   ├── vercel.json             # Flask service config
│   └── runtime.txt             # Python runtime
├── vercel.json                  # Main Vercel configuration
├── package.json                 # Node.js dependencies
├── next.config.mjs             # Next.js configuration
└── tailwind.config.ts          # Tailwind CSS configuration
```

### 1.2 Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## 🔧 Step 2: Deploy to Vercel

### 2.1 Import Project
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing your NOVAKINETIX ACADEMY code

### 2.2 Configure Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `Stem-Spark-22a60c0b96766337b6a06d6f35ec3f593ee2a9c4`
- **Build Command**: `npm run build` (or `pnpm build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install` (or `pnpm install`)

## 🔧 Step 3: Environment Variables

### 3.1 Required Environment Variables
Add these in your Vercel project settings:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URLs
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com
```

### 3.2 How to Add Environment Variables
1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add each variable with the appropriate environment (Production, Preview, Development)

## 🔧 Step 4: Flask Mail Service Configuration

### 4.1 Python Dependencies
The `flask-mail-service/requirements.txt` should contain:
```
Flask==2.3.3
Flask-Mail==0.9.1
Flask-CORS==4.0.0
python-dotenv==1.0.0
gunicorn==21.2.0
```

### 4.2 Vercel Configuration
The `vercel.json` file is already configured to handle both services:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    },
    {
      "src": "flask-mail-service/app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/email/(.*)",
      "dest": "/flask-mail-service/app.py"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "functions": {
    "flask-mail-service/app.py": {
      "maxDuration": 30
    }
  }
}
```

## 🔧 Step 5: Database Setup

### 5.1 Supabase Setup
1. Create a new Supabase project
2. Run the database migration scripts from `/scripts/` directory
3. Set up Row Level Security (RLS) policies
4. Create admin accounts using the provided scripts

### 5.2 Database Migration
```sql
-- Run these scripts in your Supabase SQL editor
-- 1. setup-database.sql
-- 2. create-admin-accounts.sql
-- 3. Any additional migration scripts
```

## 🔧 Step 6: Email Configuration

### 6.1 Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the app password in your `MAIL_PASSWORD` environment variable

### 6.2 Test Email Configuration
After deployment, test the email service:
```bash
# Test health check
curl https://your-domain.vercel.app/api/email/health

# Test templates endpoint
curl https://your-domain.vercel.app/api/email/templates
```

## 🔧 Step 7: Deploy and Test

### 7.1 Initial Deployment
1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Check for any build errors

### 7.2 Post-Deployment Testing
1. **Health Check**: Visit your domain to ensure the app loads
2. **Email Service**: Test the Flask Mail endpoints
3. **Database Connection**: Verify Supabase connection
4. **Authentication**: Test login/signup functionality

### 7.3 System Validation
Run the system validation script:
```bash
# The script will test all endpoints and functionality
node scripts/system-validation.js
```

## 🔧 Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain
1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 8.2 Update Environment Variables
After adding a custom domain, update:
```bash
NEXT_PUBLIC_SITE_URL=https://your-custom-domain.com
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

## 🔧 Step 9: Monitoring and Maintenance

### 9.1 Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Set up error tracking

### 9.2 Logs and Debugging
- Use Vercel Function Logs to debug Flask Mail service
- Monitor Next.js application logs

### 9.3 Performance Optimization
- Enable Vercel Edge Functions for better performance
- Configure caching strategies

## 🚨 Troubleshooting

### Common Issues

#### 1. Flask Mail Service Not Working
- Check environment variables are set correctly
- Verify Python dependencies in requirements.txt
- Check Vercel function logs for errors

#### 2. Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies are configured correctly
- Ensure database tables are created

#### 3. Email Not Sending
- Verify Gmail app password is correct
- Check MAIL_SERVER and MAIL_PORT settings
- Test with a simple email first

#### 4. Build Failures
- Check Node.js and Python versions
- Verify all dependencies are listed
- Check for syntax errors in code

### Debug Commands
```bash
# Test Flask Mail service locally
cd flask-mail-service
python app.py

# Test Next.js app locally
npm run dev

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $MAIL_USERNAME
```

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variable configuration
3. Test individual components locally
4. Consult the system validation script output

## 🎉 Success Checklist

- [ ] Next.js app deploys successfully
- [ ] Flask Mail service is accessible at `/api/email/*`
- [ ] Database connection works
- [ ] Email sending functionality works
- [ ] Authentication system works
- [ ] All user roles can access their dashboards
- [ ] System validation script passes all tests

---

**Deployment Status**: Ready for Production  
**Last Updated**: July 2024 