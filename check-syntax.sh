#!/bin/bash

# Daily Briefing System - Syntax Check
# Verify all JavaScript files have valid syntax without installing dependencies

echo "🔍 Checking JavaScript syntax..."
echo ""

errors=0
total=0

# Check all .js and .cjs files
for file in $(find src -name "*.js" -o -name "*.cjs" | sort); do
  total=$((total + 1))
  echo -n "Checking $file... "
  
  if node --check "$file" 2>/dev/null; then
    echo "✅"
  else
    echo "❌"
    node --check "$file"
    errors=$((errors + 1))
  fi
done

echo ""
echo "========================================="
echo "Results:"
echo "  Total files: $total"
echo "  Errors: $errors"
echo "  Passed: $((total - errors))"
echo "========================================="

if [ $errors -eq 0 ]; then
  echo "✅ All files have valid syntax!"
  exit 0
else
  echo "❌ Some files have syntax errors"
  exit 1
fi
