# PowerShell script for Supabase setup

Write-Host "Setting up Supabase for local development..." -ForegroundColor Blue

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "Supabase CLI is installed: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
}

# Link to Supabase project
Write-Host "Linking to Supabase project..." -ForegroundColor Blue
supabase link --project-ref qnuevynptgkoivekuzer --access-token sbp_9a19e77fcc89fc3234d646b3289aa184c39f5d59

# Start Supabase locally
Write-Host "Starting Supabase locally..." -ForegroundColor Blue
supabase start

# Apply migrations
Write-Host "Applying database migrations..." -ForegroundColor Blue
supabase db push

Write-Host "`nSupabase setup complete!" -ForegroundColor Green
Write-Host "`nYou can now access:"
Write-Host "- Supabase Studio: http://localhost:54323"
Write-Host "- API: http://localhost:54321"
Write-Host "- Database: postgresql://postgres:postgres@localhost:54322/postgres" 