# NOVAKINETIX ACADEMY

A comprehensive STEM education platform with role-based dashboards, tutoring systems, volunteer management, and parent progress tracking.

## 🚀 Features

- **Role-Based Access**: Student, Intern, Parent, and Admin dashboards
- **Tutoring System**: Request, schedule, and manage tutoring sessions
- **Volunteer Management**: Track volunteer hours and opportunities
- **Parent Dashboard**: Monitor children's progress and activities
- **Email Notifications**: Flask Mail integration for all communications
- **Responsive Design**: Works seamlessly across all devices

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.9+
- Supabase account
- SMTP email service (Gmail, SendGrid, etc.)

## 🛠️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd Novakinetix-Academy-main/Stem-Spark-22a60c0b96766337b6a06d6f35ec3f593ee2a9c4
npm install
```

### 2. Install Python Dependencies

```bash
cd flask-mail-service
pip install -r requirements.txt
cd ..
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Flask Mail Configuration
FLASK_MAIL_SERVER=smtp.gmail.com
FLASK_MAIL_PORT=587
FLASK_MAIL_USE_TLS=true
FLASK_MAIL_USE_SSL=false
FLASK_MAIL_USERNAME=your_email@gmail.com
FLASK_MAIL_PASSWORD=your_app_password
FLASK_MAIL_DEFAULT_SENDER=your_email@gmail.com
FLASK_MAIL_SENDER_NAME=NOVAKINETIX ACADEMY
FLASK_MAIL_SERVICE_URL=http://localhost:5000

# Application URLs
NOVAKINETIX_ACADEMY_URL=http://localhost:3000
```

### 4. Database Setup

Run the database migration scripts in your Supabase SQL editor:

```sql
-- Run scripts/setup-database.sql
-- Run scripts/create-admin-accounts.sql
-- Run scripts/sample-data.sql
```

### 5. Start Development Servers

```bash
# Terminal 1: Start Flask Mail Service
cd flask-mail-service
python app.py

# Terminal 2: Start Next.js Application
npm run dev
```

## 🌐 Deployment on Vercel

### 1. Environment Variables

Add these environment variables in your Vercel project settings:

```env
FLASK_MAIL_SERVER=smtp.gmail.com
FLASK_MAIL_PORT=587
FLASK_MAIL_USE_TLS=true
FLASK_MAIL_USE_SSL=false
FLASK_MAIL_USERNAME=your_email@gmail.com
FLASK_MAIL_PASSWORD=your_app_password
FLASK_MAIL_DEFAULT_SENDER=your_email@gmail.com
FLASK_MAIL_SENDER_NAME=NOVAKINETIX ACADEMY
FLASK_MAIL_SERVICE_URL=https://your-domain.vercel.app/api/email
NOVAKINETIX_ACADEMY_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Deploy

```bash
vercel --prod
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Role-based dashboards
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utility functions and services
├── flask-mail-service/    # Python email microservice
├── scripts/              # Database and setup scripts
└── public/               # Static assets
```

## 🔐 Authentication & Roles

- **Students**: Access to learning materials and tutoring requests
- **Interns**: Manage tutoring sessions and volunteer opportunities
- **Parents**: Monitor children's progress and activities
- **Admins**: Full system management and user administration

## 📧 Email System

The Flask Mail service handles all email notifications:

- Tutoring request confirmations
- Session reminders
- Volunteer opportunity notifications
- Parent progress updates
- Admin notifications

## 🧪 Testing

Run the interactive element test:

```bash
node scripts/test-interactive-elements.js
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure Supabase credentials are correct
2. **Email Service**: Verify SMTP settings and app passwords
3. **Build Errors**: Check Node.js and Python versions
4. **CORS Issues**: Verify Flask Mail service URL configuration

### Support

For issues and questions, please check the troubleshooting guides in the `scripts/` directory.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**NOVAKINETIX ACADEMY** - Empowering STEM Education for the Next Generation 