#!/bin/bash

##############################################################################
# SaaS Factory AI App Generator - Automated Component Generation
#
# This script uses Claude AI to generate production-ready React components
# for new SaaS applications based on natural language descriptions.
#
# Usage: ./ai-create-app.sh
#
# The script will:
# 1. Prompt you for app details in natural language
# 2. Generate a React component using Claude API
# 3. Create the app in the database
# 4. Create the frontend structure
# 5. Make the app immediately available
#
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo -e "${RED}❌ Error: ANTHROPIC_API_KEY environment variable not set${NC}"
  echo "Set it with: export ANTHROPIC_API_KEY=your_api_key_here"
  exit 1
fi

API_URL="${API_URL:-http://localhost:3000}"

# Temporary files
PROMPT_FILE="/tmp/app_generation_prompt.txt"
COMPONENT_FILE="/tmp/generated_component.tsx"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   🚀 SaaS Factory AI App Generator     ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step 1: Collect user input
echo -e "${YELLOW}Tell me about your app...${NC}"
echo ""

read -p "What app do you want to build? (describe it in natural language): " APP_DESCRIPTION
echo ""

read -p "What should users input? (e.g., 'YouTube URL', 'Text to summarize'): " USER_INPUT
echo ""

read -p "What should the app output? (e.g., 'Blog post', 'Summary'): " APP_OUTPUT
echo ""

# Step 2: Generate app name and slug from description
echo -e "${YELLOW}Generating app metadata...${NC}"

# Simple slug generation: lowercase, remove special chars, replace spaces with hyphens
APP_NAME=$(echo "$APP_DESCRIPTION" | sed 's/^A tool that //' | sed 's/^a tool that //')
APP_SLUG=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 -]//g' | sed 's/  */ /g' | tr ' ' '-' | sed 's/-$//')

# Limit slug length
if [ ${#APP_SLUG} -gt 50 ]; then
  APP_SLUG="${APP_SLUG:0:50}"
fi

echo "Generated app name: $APP_NAME"
echo "Generated app slug: $APP_SLUG"
echo ""

# Confirm with user
read -p "Does this look correct? (y/n) " -n 1 -r CONFIRM
echo
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
  read -p "Enter custom app slug (lowercase, hyphens only): " CUSTOM_SLUG
  APP_SLUG=$CUSTOM_SLUG
fi

# Step 3: Generate the React component using Claude
echo -e "${YELLOW}🤖 Calling Claude AI to generate component...${NC}"
echo ""

# Create the prompt for Claude
cat > "$PROMPT_FILE" << 'PROMPT_END'
You are an expert React/TypeScript developer. Generate a production-ready Next.js component for a SaaS application.

App Description: {APP_DESCRIPTION}
User Input Fields: {USER_INPUT}
App Output: {APP_OUTPUT}

Generate a React component called AppUI.tsx that:
1. Has a form for users to input: {USER_INPUT}
2. Calls an API endpoint POST /api/{APP_SLUG}/process when submitted
3. Displays the result/output: {APP_OUTPUT}
4. Uses Tailwind CSS for styling (no external UI libraries)
5. Includes proper loading states and error handling
6. Has TypeScript types
7. Is fully functional and production-ready
8. Uses React hooks (useState, useEffect)

Important:
- Export as default export
- Use 'use client' directive at the top
- Include proper error messages
- Add a loading spinner during processing
- Make it beautiful and professional
- Add input validation

Output ONLY the complete, runnable code. No explanations or markdown.
PROMPT_END

# Replace placeholders with actual values
sed -i.bak "s/{APP_DESCRIPTION}/$APP_DESCRIPTION/g" "$PROMPT_FILE"
sed -i.bak "s/{USER_INPUT}/$USER_INPUT/g" "$PROMPT_FILE"
sed -i.bak "s/{APP_OUTPUT}/$APP_OUTPUT/g" "$PROMPT_FILE"
sed -i.bak "s/{APP_SLUG}/$APP_SLUG/g" "$PROMPT_FILE"
rm -f "$PROMPT_FILE.bak"

# Call Claude API
echo "Sending request to Claude API..."

CLAUDE_RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 4000,
    \"temperature\": 0.7,
    \"messages\": [{
      \"role\": \"user\",
      \"content\": \"$(cat $PROMPT_FILE | sed 's/"/\\"/g' | tr '\n' ' ')\"
    }]
  }")

# Extract the component code from response
COMPONENT_CODE=$(echo "$CLAUDE_RESPONSE" | grep -o '"text":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$COMPONENT_CODE" ] || [ "$COMPONENT_CODE" = "null" ]; then
  echo -e "${RED}❌ Failed to generate component from Claude API${NC}"
  echo "Response: $CLAUDE_RESPONSE"
  exit 1
fi

# Save the component
echo "$COMPONENT_CODE" > "$COMPONENT_FILE"
echo -e "${GREEN}✅ Component generated successfully${NC}"
echo ""

# Step 4: Create the app in database
echo -e "${YELLOW}📱 Creating app in database...${NC}"

APP_CREATION_RESPONSE=$(curl -s -X POST "$API_URL/api/apps" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$APP_NAME\",
    \"slug\": \"$APP_SLUG\",
    \"description\": \"$APP_DESCRIPTION\",
    \"primary_color\": \"#3498db\"
  }")

if echo "$APP_CREATION_RESPONSE" | grep -q '"success":true'; then
  APP_ID=$(echo "$APP_CREATION_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo -e "${GREEN}✅ App created (ID: $APP_ID)${NC}"
else
  echo -e "${RED}❌ Failed to create app${NC}"
  echo "$APP_CREATION_RESPONSE"
  exit 1
fi

echo ""

# Step 5: Create frontend directory and save component
echo -e "${YELLOW}📁 Setting up frontend files...${NC}"

COMPONENT_DIR="frontend/src/app/[$APP_SLUG]"
mkdir -p "$COMPONENT_DIR"

# Save the generated component with proper formatting
echo "'use client';" > "$COMPONENT_DIR/AppUI.tsx"
echo "" >> "$COMPONENT_DIR/AppUI.tsx"
echo "$COMPONENT_CODE" >> "$COMPONENT_DIR/AppUI.tsx"

echo -e "${GREEN}✅ Component saved to: $COMPONENT_DIR/AppUI.tsx${NC}"

# Create a page.tsx file that uses the component
cat > "$COMPONENT_DIR/page.tsx" << 'PAGE_TEMPLATE'
import AppUI from './AppUI';

export const metadata = {
  title: 'APP_NAME_PLACEHOLDER',
  description: 'APP_DESCRIPTION_PLACEHOLDER',
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <AppUI />
    </main>
  );
}
PAGE_TEMPLATE

# Replace placeholders
sed -i.bak "s/APP_NAME_PLACEHOLDER/$APP_NAME/g" "$COMPONENT_DIR/page.tsx"
sed -i.bak "s/APP_DESCRIPTION_PLACEHOLDER/$APP_DESCRIPTION/g" "$COMPONENT_DIR/page.tsx"
rm -f "$COMPONENT_DIR/page.tsx.bak"

echo -e "${GREEN}✅ Page template created${NC}"

echo ""

# Step 6: Display success message
echo -e "${GREEN}╔════════════════════════════════════════╗"
echo "║  ✨ Your AI App is Ready!              ║"
echo "╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📋 App Details:${NC}"
echo "  Name: $APP_NAME"
echo "  Slug: $APP_SLUG"
echo "  ID: $APP_ID"
echo ""

echo -e "${BLUE}🔗 Access URLs:${NC}"
echo "  Frontend: http://localhost:5173/$APP_SLUG"
echo "  API: http://localhost:3000/api/apps/$APP_ID"
echo ""

echo -e "${BLUE}📁 Files Created:${NC}"
echo "  Component: $COMPONENT_DIR/AppUI.tsx"
echo "  Page: $COMPONENT_DIR/page.tsx"
echo ""

echo -e "${BLUE}⚡ Next Steps:${NC}"
echo "  1. Start the development server: npm run dev:full"
echo "  2. Open http://localhost:5173/$APP_SLUG in your browser"
echo "  3. Test the generated app"
echo "  4. Customize the component as needed"
echo "  5. Create the backend API endpoint: /api/$APP_SLUG/process"
echo ""

echo -e "${YELLOW}💡 Note:${NC}"
echo "  The component generates the UI, but you still need to:"
echo "  - Create the backend /api/$APP_SLUG/process endpoint"
echo "  - Implement the actual processing logic"
echo "  - Test the full flow"
echo ""

# Cleanup
rm -f "$PROMPT_FILE" "$COMPONENT_FILE"

# Optional: Open in browser
if command -v open &> /dev/null; then
  read -p "Open app in browser? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "http://localhost:5173/$APP_SLUG"
  fi
fi

exit 0
