#!/bin/bash

##############################################################################
# SaaS Factory Installer - Automated App Creation Script
#
# Usage: ./create-new-app.sh "App Name" app-slug [optional: description]
#
# Example:
#   ./create-new-app.sh "YouTube to Blog" youtube-to-blog "Convert YouTube videos to blog posts"
#
# This script:
# 1. Creates a new app in the multi-tenant database
# 2. Creates default pages and plans
# 3. Generates a unique slug-based URL route
# 4. Makes the app immediately available
#
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend"
API_URL="${API_URL:-http://localhost:3000}"

# Validate arguments
if [ $# -lt 2 ]; then
  echo -e "${RED}❌ Usage: $0 \"<App Name>\" <app-slug> [description]${NC}"
  echo ""
  echo "Example:"
  echo "  ./create-new-app.sh \"YouTube to Blog\" youtube-to-blog \"Convert YouTube videos to blog posts\""
  exit 1
fi

APP_NAME="$1"
APP_SLUG="$2"
DESCRIPTION="${3:-A new SaaS application built with the SaaS Factory}"

# Validate slug format
if ! [[ "$APP_SLUG" =~ ^[a-z0-9\-]+$ ]]; then
  echo -e "${RED}❌ Slug must contain only lowercase letters, numbers, and hyphens${NC}"
  exit 1
fi

echo -e "${BLUE}🚀 SaaS Factory App Installer${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}Creating new app:${NC}"
echo "  Name: $APP_NAME"
echo "  Slug: $APP_SLUG"
echo "  Description: $DESCRIPTION"
echo ""

# Step 1: Call API to create the app
echo -e "${YELLOW}📱 Creating app in database...${NC}"

RESPONSE=$(curl -s -X POST "$API_URL/api/apps" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$APP_NAME\",
    \"slug\": \"$APP_SLUG\",
    \"description\": \"$DESCRIPTION\",
    \"primary_color\": \"#3498db\"
  }")

# Check if request was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  APP_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}✅ App created with ID: $APP_ID${NC}"
else
  echo -e "${RED}❌ Failed to create app:${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo ""

# Step 2: Create frontend directory structure (optional)
if [ -d "frontend/src/app" ]; then
  echo -e "${YELLOW}📁 Creating frontend directory...${NC}"
  mkdir -p "frontend/src/app/\[$APP_SLUG\]"
  echo -e "${GREEN}✅ Frontend directory created at: frontend/src/app/[$APP_SLUG]${NC}"
  echo ""
fi

# Step 3: Display success message
echo -e "${GREEN}✨ Success! Your new app is ready!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "  1. Frontend URL: http://localhost:5173/$APP_SLUG"
echo "  2. Backend API: http://localhost:3000/api/apps/$APP_ID"
echo "  3. Dashboard: http://localhost:3000/admin/apps/$APP_ID"
echo ""
echo -e "${BLUE}To customize the app:${NC}"
echo "  1. Update the app settings: ./scripts/update-app-settings.sh $APP_ID"
echo "  2. Add custom pages: ./scripts/add-page.sh $APP_ID"
echo "  3. Configure pricing: ./scripts/add-plan.sh $APP_ID"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "  - SaaS Factory Docs: ./docs/SAAS_FACTORY.md"
echo "  - App Configuration: ./docs/APP_CONFIGURATION.md"
echo ""

# Step 4: Optional - Open in browser
if command -v open &> /dev/null; then
  read -p "Open app in browser? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "http://localhost:5173/$APP_SLUG"
  fi
fi

exit 0
