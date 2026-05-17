#!/usr/bin/env node
/**
 * Quick validation script to verify PrayerWheel component structure
 * Run with: node validate.js
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/components/PrayerWheel.jsx',
  'src/components/PrayerWheel.css',
  'src/components/usePrayerWheelGSAP.js',
];

const baseDir = 'd:/trialme/golden-ratio-site';

console.log('🔍 Validating PrayerWheel Component Files...\n');

let allValid = true;

files.forEach((file) => {
  const fullPath = path.join(baseDir, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n').length;
    console.log(`✅ ${file}`);
    console.log(`   Size: ${content.length} bytes, ${lines} lines\n`);
  } catch (err) {
    console.log(`❌ ${file}`);
    console.log(`   Error: ${err.message}\n`);
    allValid = false;
  }
});

// Check key imports and exports
const prayerWheelPath = path.join(baseDir, 'src/components/PrayerWheel.jsx');
const usePrayerWheelPath = path.join(baseDir, 'src/components/usePrayerWheelGSAP.js');

console.log('📋 Checking imports and exports...\n');

try {
  const prayerWheelContent = fs.readFileSync(prayerWheelPath, 'utf-8');
  
  if (prayerWheelContent.includes('export default function PrayerWheel')) {
    console.log('✅ PrayerWheel exports default function');
  } else {
    console.log('❌ PrayerWheel missing default export');
    allValid = false;
  }
  
  if (prayerWheelContent.includes("import { usePrayerWheelGSAP }")) {
    console.log('✅ PrayerWheel imports usePrayerWheelGSAP hook');
  } else {
    console.log('❌ PrayerWheel missing hook import');
    allValid = false;
  }
  
  if (prayerWheelContent.includes("import './PrayerWheel.css'")) {
    console.log('✅ PrayerWheel imports CSS');
  } else {
    console.log('❌ PrayerWheel missing CSS import');
    allValid = false;
  }
  
  if (prayerWheelContent.includes('role="img"') && prayerWheelContent.includes('aria-label')) {
    console.log('✅ Accessibility attributes present');
  } else {
    console.log('❌ Missing accessibility attributes');
    allValid = false;
  }
} catch (err) {
  console.log('❌ Error reading PrayerWheel.jsx:', err.message);
  allValid = false;
}

console.log();

try {
  const hookContent = fs.readFileSync(usePrayerWheelPath, 'utf-8');
  
  if (hookContent.includes('export function usePrayerWheelGSAP')) {
    console.log('✅ usePrayerWheelGSAP exports function');
  } else {
    console.log('❌ usePrayerWheelGSAP missing export');
    allValid = false;
  }
  
  if (hookContent.includes('import gsap')) {
    console.log('✅ Hook imports gsap');
  } else {
    console.log('❌ Hook missing gsap import');
    allValid = false;
  }
  
  if (hookContent.includes('prefersReducedMotion')) {
    console.log('✅ Reduced motion support implemented');
  } else {
    console.log('❌ Missing reduced motion support');
    allValid = false;
  }
  
  if (hookContent.includes('triggerMantraReveal') && hookContent.includes('emitParticles')) {
    console.log('✅ All animation phases present');
  } else {
    console.log('❌ Missing animation phases');
    allValid = false;
  }
} catch (err) {
  console.log('❌ Error reading usePrayerWheelGSAP.js:', err.message);
  allValid = false;
}

console.log('\n' + (allValid ? '✅ All validations passed!' : '❌ Some validations failed'));
process.exit(allValid ? 0 : 1);
