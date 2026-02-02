#!/bin/bash

# Fix import statements after renaming .cjs to .js

echo "🔧 Fixing import statements..."
cd /root/.openclaw/workspace/daily-briefing-system/src

# Fix .cjs references to .js
find . -name "*.js" -type f -exec sed -i "s/from '\.\/\([^']*\)\.cjs'/from '.\/\1.js'/g" {} \;
find . -name "*.js" -type f -exec sed -i "s/from \"\.\/\([^"]*\)\.cjs\"/from \".\/\1.js\"/g" {} \;

# Fix rss.cjs to rss.js
find . -name "*.js" -type f -exec sed -i "s/fetchers\/rss'/fetchers\/rss'/g" {} \;

echo "✅ Done"
