# Stem-Spark

A modern web application for managing internships and educational programs.

## Features

- User authentication with Supabase
- Admin dashboard for managing internships
- Internship application system
- Password reset functionality
- Modern UI with Tailwind CSS and shadcn/ui

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/LearnBrainLink/Stem-Spark.git
cd Stem-Spark
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qnuevynptgkoivekuzer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://v0-empowering-young-engineers-agsvrn927.vercel.app
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js app directory containing all pages and API routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and configurations
- `/public` - Static assets
- `/styles` - Global styles and Tailwind configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Supabase Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qnuevynptgkoivekuzer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://v0-empowering-young-engineers-agsvrn927.vercel.app
```

### GitHub Secrets

Add the following secrets to your GitHub repository:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token

### Local Development

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref qnuevynptgkoivekuzer
```

3. Start local development:
```bash
supabase start
```

### Database Migrations

1. Create a new migration:
```bash
supabase migration new migration_name
```

2. Apply migrations:
```bash
supabase db push
```

### Authentication

The project uses Supabase Auth with the following features:

- Email/Password authentication
- Social login (Google, GitHub)
- Role-based access control
- Email verification
- Session management

### Database Schema

The database includes the following tables:

- `profiles`: User profiles with role information
- `user_activities`: User activity logging

### Row Level Security

RLS policies are implemented for:

- Profile access control
- Activity logging
- Admin privileges

### Testing

Run the connection test:
```bash
npm run test:connection
```

Visit `/test-connection` to verify the Supabase setup.
