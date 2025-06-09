#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Supabase for local development...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Link to Supabase project
echo -e "${BLUE}Linking to Supabase project...${NC}"
supabase link --project-ref qnuevynptgkoivekuzer --access-token sbp_9a19e77fcc89fc3234d646b3289aa184c39f5d59

# Start Supabase locally
echo -e "${BLUE}Starting Supabase locally...${NC}"
supabase start

# Apply migrations
echo -e "${BLUE}Applying database migrations...${NC}"
supabase db push

echo -e "${GREEN}Supabase setup complete!${NC}"
echo -e "You can now access:"
echo -e "- Supabase Studio: http://localhost:54323"
echo -e "- API: http://localhost:54321"
echo -e "- Database: postgresql://postgres:postgres@localhost:54322/postgres" 