import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  'auth.test.js',
  'concurrency.test.js',
  'id_upload_safety.test.js',
  'offline_payments_and_bugs.test.js',
  'phase2_e2e.test.js',
  'phase4_e2e_search.test.js',
  'phase4_matching.test.js',
  'phase5_socket.test.js',
  'phase6_safety.test.js',
  'phase7_analytics.test.js',
  'phase8_advanced.test.js',
];

async function runTestFile(file) {
  return new Promise((resolve) => {
    const fullPath = path.join(__dirname, file);
    const start = Date.now();
    const child = spawn(process.execPath, [fullPath], {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      resolve({ file, code, duration });
    });
  });
}

async function main() {
  console.log(`\n========================================`);
  console.log(`🚀 SmartRide Backend Test Suites Runner`);
  console.log(`========================================\n`);

  const results = [];
  for (const file of testFiles) {
    console.log(`\n▶️ Running [${file}]...`);
    const res = await runTestFile(file);
    results.push(res);
  }

  console.log(`\n========================================`);
  console.log(`📊 Test Summary`);
  console.log(`========================================`);

  let allPassed = true;
  for (const r of results) {
    const status = r.code === 0 ? '✅ PASSED' : '❌ FAILED';
    if (r.code !== 0) allPassed = false;
    console.log(`${status} - ${r.file} (${r.duration}s)`);
  }

  console.log(`========================================\n`);
  if (!allPassed) {
    console.error('❌ Some test suites failed.');
    process.exit(1);
  } else {
    console.log('🎉 All 11 test suites passed successfully!\n');
    process.exit(0);
  }
}

main();
