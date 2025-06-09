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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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
