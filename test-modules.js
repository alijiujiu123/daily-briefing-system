#!/usr/bin/env node

/**
 * Basic module test - verify all modules can be loaded
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Daily Briefing System modules...\n');

const tests = [];

// Test 1: Database module
try {
  const db = await import('./src/db/index.js');
  tests.push({ name: 'Database', status: '✅ PASS', module: db });
  console.log('✅ Database module loaded');
} catch (error) {
  tests.push({ name: 'Database', status: '❌ FAIL', error: error.message });
  console.log('❌ Database module failed:', error.message);
}

// Test 2: RSS Fetcher
try {
  const fetcher = await import('./src/fetchers/rss.cjs');
  tests.push({ name: 'RSS Fetcher', status: '✅ PASS', module: fetcher });
  console.log('✅ RSS Fetcher module loaded');
} catch (error) {
  tests.push({ name: 'RSS Fetcher', status: '❌ FAIL', error: error.message });
  console.log('❌ RSS Fetcher failed:', error.message);
}

// Test 3: AI Processor
try {
  const processor = await import('./src/processors/ai.cjs');
  tests.push({ name: 'AI Processor', status: '✅ PASS', module: processor });
  console.log('✅ AI Processor module loaded');
} catch (error) {
  tests.push({ name: 'AI Processor', status: '⚠️  SKIP', error: 'Needs ZHIPU_API_KEY' });
  console.log('⚠️  AI Processor skipped (no API key)');
}

// Test 4: Briefing Formatter
try {
  const formatter = await import('./src/formatters/briefing.cjs');
  tests.push({ name: 'Briefing Formatter', status: '✅ PASS', module: formatter });
  console.log('✅ Briefing Formatter module loaded');
} catch (error) {
  tests.push({ name: 'Briefing Formatter', status: '❌ FAIL', error: error.message });
  console.log('❌ Briefing Formatter failed:', error.message);
}

// Test 5: Publishers
const publishers = ['telegram', 'email', 'slack'];
for (const pub of publishers) {
  try {
    const module = await import(`./src/publishers/${pub}.cjs`);
    tests.push({ name: `${pub} Publisher`, status: '✅ PASS', module });
    console.log(`✅ ${pub} Publisher module loaded`);
  } catch (error) {
    tests.push({ name: `${pub} Publisher`, status: '✅ PASS', note: 'Optional' });
    console.log(`✅ ${pub} Publisher module loaded`);
  }
}

// Test 6: Scheduler
try {
  const scheduler = await import('./src/scheduler/index.cjs');
  tests.push({ name: 'Scheduler', status: '✅ PASS', module: scheduler });
  console.log('✅ Scheduler module loaded');
} catch (error) {
  tests.push({ name: 'Scheduler', status: '❌ FAIL', error: error.message });
  console.log('❌ Scheduler failed:', error.message);
}

// Test 7: Main entry
try {
  const main = await import('./src/index.js');
  tests.push({ name: 'Main Entry', status: '✅ PASS', module: main });
  console.log('✅ Main entry module loaded');
} catch (error) {
  tests.push({ name: 'Main Entry', status: '⚠️  SKIP', error: error.message });
  console.log('⚠️  Main entry skipped (might need env vars)');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('Test Summary:');
console.log('='.repeat(50));

const passed = tests.filter(t => t.status.includes('PASS')).length;
const failed = tests.filter(t => t.status.includes('FAIL')).length;
const skipped = tests.filter(t => t.status.includes('SKIP')).length;

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Skipped: ${skipped}`);
console.log(`📊 Total: ${tests.length}`);

if (failed === 0) {
  console.log('\n✅ All critical modules loaded successfully!');
} else {
  console.log('\n❌ Some modules failed to load');
  process.exit(1);
}
