#!/bin/bash
#
# NodeForge npm publish script
# Usage:
#   ./deploy/publish.sh           # publish current version
#   ./deploy/publish.sh patch     # bump patch (1.0.0 -> 1.0.1) and publish
#   ./deploy/publish.sh minor     # bump minor (1.0.0 -> 1.1.0) and publish
#   ./deploy/publish.sh major     # bump major (1.0.0 -> 2.0.0) and publish
#   ./deploy/publish.sh --dry-run # simulate publish without uploading

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Move to project root
cd "$(dirname "$0")/.."

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  NodeForge npm Publish${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ----------------------------------------
# 1. Pre-flight checks
# ----------------------------------------
echo -e "${YELLOW}[1/6] Pre-flight checks...${NC}"

# Check npm login
if ! npm whoami > /dev/null 2>&1; then
  echo -e "${RED}Error: Not logged in to npm.${NC}"
  echo "Run 'npm login' first."
  exit 1
fi

NPM_USER=$(npm whoami)
echo -e "  Logged in as: ${GREEN}${NPM_USER}${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo -e "${YELLOW}  Warning: You have uncommitted changes.${NC}"
  git status --short
  echo ""
  read -p "  Continue anyway? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
  fi
fi

# Parse arguments
DRY_RUN=false
BUMP_TYPE=""

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    patch|minor|major) BUMP_TYPE=$arg ;;
    *)
      echo -e "${RED}Unknown argument: $arg${NC}"
      echo "Usage: ./deploy/publish.sh [patch|minor|major] [--dry-run]"
      exit 1
      ;;
  esac
done

# ----------------------------------------
# 2. Version bump (if requested)
# ----------------------------------------
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo ""
echo -e "${YELLOW}[2/6] Version...${NC}"

if [ -n "$BUMP_TYPE" ]; then
  npm version $BUMP_TYPE --no-git-tag-version > /dev/null
  NEW_VERSION=$(node -p "require('./package.json').version")
  echo -e "  Bumped: ${RED}${CURRENT_VERSION}${NC} -> ${GREEN}${NEW_VERSION}${NC} (${BUMP_TYPE})"
else
  NEW_VERSION=$CURRENT_VERSION
  echo -e "  Current version: ${GREEN}${NEW_VERSION}${NC} (no bump)"
fi

# ----------------------------------------
# 3. Install dependencies
# ----------------------------------------
echo ""
echo -e "${YELLOW}[3/6] Installing dependencies...${NC}"
npm install --silent
echo -e "  ${GREEN}Done${NC}"

# ----------------------------------------
# 4. Build
# ----------------------------------------
echo ""
echo -e "${YELLOW}[4/6] Building...${NC}"
npm run build
echo -e "  ${GREEN}Build complete${NC}"

# Copy to examples/dist if it exists
if [ -d "examples/dist" ]; then
  cp dist/nodeforge.min.js examples/dist/nodeforge.min.js
  cp dist/nodeforge.min.css examples/dist/nodeforge.min.css
  echo -e "  Copied to examples/dist/"
fi

# ----------------------------------------
# 5. Verify package contents
# ----------------------------------------
echo ""
echo -e "${YELLOW}[5/6] Package contents:${NC}"
npm pack --dry-run 2>&1 | head -30
echo ""

# Show package size
TARBALL_SIZE=$(npm pack --dry-run 2>&1 | tail -1)
echo -e "  ${CYAN}${TARBALL_SIZE}${NC}"

# ----------------------------------------
# 6. Publish
# ----------------------------------------
echo ""
echo -e "${YELLOW}[6/6] Publishing...${NC}"
echo -e "  Package: ${CYAN}nodeforge@${NEW_VERSION}${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "  ${YELLOW}[DRY RUN] Simulating publish...${NC}"
  npm publish --dry-run
  echo ""
  echo -e "  ${YELLOW}Dry run complete. No package was published.${NC}"
else
  read -p "  Publish nodeforge@${NEW_VERSION} to npm? (y/N) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm publish
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Published nodeforge@${NEW_VERSION}${NC}"
    echo -e "${GREEN}  https://www.npmjs.com/package/nodeforge${NC}"
    echo -e "${GREEN}========================================${NC}"

    # Git tag (if in a git repo)
    if git rev-parse --git-dir > /dev/null 2>&1; then
      echo ""
      read -p "  Create git tag v${NEW_VERSION}? (y/N) " -n 1 -r
      echo ""
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add package.json
        git commit -m "release: v${NEW_VERSION}"
        git tag "v${NEW_VERSION}"
        echo -e "  ${GREEN}Tagged v${NEW_VERSION}${NC}"
        echo -e "  Run 'git push && git push --tags' to push."
      fi
    fi
  else
    # Revert version bump if cancelled
    if [ -n "$BUMP_TYPE" ]; then
      npm version $CURRENT_VERSION --no-git-tag-version > /dev/null
      echo -e "  ${YELLOW}Reverted version to ${CURRENT_VERSION}${NC}"
    fi
    echo -e "${RED}  Publish cancelled.${NC}"
  fi
fi
