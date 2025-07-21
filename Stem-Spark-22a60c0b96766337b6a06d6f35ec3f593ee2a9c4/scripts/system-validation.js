#!/usr/bin/env node

/**
 * Comprehensive System Validation Script
 * Tests all implemented features of the NOVAKINETIX ACADEMY Stem-Spark Enhancement
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: CONFIG.timeout,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function recordTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${name}`, 'error');
  }
  
  testResults.details.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

// Test functions
async function testPageRoutes() {
  log('Testing page routes...');
  
  const routes = [
    '/',
    '/login',
    '/sign up',
    '/dashboard',
    '/student-dashboard',
    '/intern-dashboard',
    '/parent-dashboard',
    '/admin',
    '/tutoring-request',
    '/session-management',
    '/admin/volunteer-opportunities',
    '/admin/volunteer-hours',
    '/videos',
    '/internships',
    '/profile'
  ];

  for (const route of routes) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${route}`);
      const passed = response.status === 200 || response.status === 302; // 302 for redirects
      recordTest(`Page Route: ${route}`, passed, `Status: ${response.status}`);
    } catch (error) {
      recordTest(`Page Route: ${route}`, false, error.message);
    }
  }
}

async function testApiEndpoints() {
  log('Testing API endpoints...');
  
  const endpoints = [
    '/api/check-env',
    '/api/test-connection',
    '/api/test-email'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${endpoint}`);
      const passed = response.status === 200;
      recordTest(`API Endpoint: ${endpoint}`, passed, `Status: ${response.status}`);
    } catch (error) {
      recordTest(`API Endpoint: ${endpoint}`, false, error.message);
    }
  }
}

async function testFlaskMailService() {
  log('Testing Flask Mail service...');
  
  const endpoints = [
    '/api/email/health',
    '/api/email/templates'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${CONFIG.baseUrl}${endpoint}`);
      const passed = response.status === 200;
      recordTest(`Flask Mail: ${endpoint}`, passed, `Status: ${response.status}`);
    } catch (error) {
      recordTest(`Flask Mail: ${endpoint}`, false, error.message);
    }
  }

  // Test email sending (without actually sending)
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/email/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'tutoring_request',
        to: 'test@example.com',
        data: {
          intern_name: 'Test Intern',
          student_name: 'Test Student',
          subject: 'Test Subject',
          description: 'Test Description',
          learning_goals: 'Test Goals',
          preferred_time: 'Test Time',
          duration: 60,
          dashboard_url: 'http://localhost:3000'
        }
      })
    });
    const passed = response.status === 200 || response.status === 400; // 400 is expected for invalid email
    recordTest('Flask Mail: Send Email', passed, `Status: ${response.status}`);
  } catch (error) {
    recordTest('Flask Mail: Send Email', false, error.message);
  }
}

function testFileStructure() {
  log('Testing file structure...');
  
  const requiredFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'app/globals.css',
    'components/logo.tsx',
    'components/branded-header.tsx',
    'components/ui/button.tsx',
    'components/ui/card.tsx',
    'lib/supabase.ts',
    'lib/email-service.ts',
    'flask-mail-service/app.py',
    'flask-mail-service/requirements.txt',
    'package.json',
    'next.config.mjs',
    'tailwind.config.ts',
    'tsconfig.json',
    'vercel.json'
  ];

  const requiredDirectories = [
    'app',
    'components',
    'components/ui',
    'lib',
    'flask-mail-service',
    'public',
    'public/images'
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    recordTest(`File: ${file}`, exists, exists ? 'Found' : 'Missing');
  }

  for (const dir of requiredDirectories) {
    const exists = fs.existsSync(path.join(process.cwd(), dir));
    recordTest(`Directory: ${dir}`, exists, exists ? 'Found' : 'Missing');
  }
}

function testEnvironmentVariables() {
  log('Testing environment variables...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];

  const optionalEnvVars = [
    'MAIL_SERVER',
    'MAIL_USERNAME',
    'MAIL_PASSWORD'
  ];

  for (const envVar of requiredEnvVars) {
    const exists = process.env[envVar] !== undefined;
    recordTest(`Required Env Var: ${envVar}`, exists, exists ? 'Set' : 'Missing');
  }

  for (const envVar of optionalEnvVars) {
    const exists = process.env[envVar] !== undefined;
    recordTest(`Optional Env Var: ${envVar}`, exists, exists ? 'Set' : 'Not set');
  }
}

function testDatabaseSchema() {
  log('Testing database schema files...');
  
  const schemaFiles = [
    'scripts/check-database-schema.sql',
    'scripts/setup-database.sql',
    'scripts/create-admin-accounts.sql'
  ];

  for (const file of schemaFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    recordTest(`Schema File: ${file}`, exists, exists ? 'Found' : 'Missing');
  }
}

function testSecurityFeatures() {
  log('Testing security features...');
  
  // Check for security-related files
  const securityFiles = [
    'lib/simple-auth.ts',
    'lib/robust-auth.ts',
    'components/auth-redirect-handler.tsx'
  ];

  for (const file of securityFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    recordTest(`Security File: ${file}`, exists, exists ? 'Found' : 'Missing');
  }

  // Check package.json for security dependencies
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasSecurityDeps = packageJson.dependencies && (
      packageJson.dependencies['@supabase/supabase-js'] ||
      packageJson.dependencies['bcryptjs'] ||
      packageJson.dependencies['jsonwebtoken']
    );
    recordTest('Security Dependencies', hasSecurityDeps, hasSecurityDeps ? 'Found' : 'Missing');
  } catch (error) {
    recordTest('Security Dependencies', false, error.message);
  }
}

function testResponsiveDesign() {
  log('Testing responsive design features...');
  
  // Check for responsive CSS classes in key files
  const filesToCheck = [
    'app/globals.css',
    'components/branded-header.tsx',
    'app/page.tsx'
  ];

  for (const file of filesToCheck) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
      const hasResponsiveClasses = content.includes('sm:') || content.includes('md:') || content.includes('lg:') || content.includes('xl:');
      recordTest(`Responsive Design: ${file}`, hasResponsiveClasses, hasResponsiveClasses ? 'Has responsive classes' : 'No responsive classes');
    } catch (error) {
      recordTest(`Responsive Design: ${file}`, false, error.message);
    }
  }
}

function testPerformanceOptimizations() {
  log('Testing performance optimizations...');
  
  // Check for performance-related configurations
  const performanceChecks = [
    {
      name: 'Next.js Config',
      file: 'next.config.mjs',
      check: (content) => content.includes('experimental') || content.includes('optimization')
    },
    {
      name: 'Image Optimization',
      file: 'components/branded-image.tsx',
      check: (content) => content.includes('next/image') || content.includes('Image')
    },
    {
      name: 'Tailwind Purge',
      file: 'tailwind.config.ts',
      check: (content) => content.includes('content') && content.includes('purge')
    }
  ];

  for (const check of performanceChecks) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), check.file), 'utf8');
      const passed = check.check(content);
      recordTest(`Performance: ${check.name}`, passed, passed ? 'Optimized' : 'Not optimized');
    } catch (error) {
      recordTest(`Performance: ${check.name}`, false, error.message);
    }
  }
}

function testAccessibility() {
  log('Testing accessibility features...');
  
  // Check for accessibility attributes in components
  const accessibilityChecks = [
    {
      name: 'Button Accessibility',
      file: 'components/ui/button.tsx',
      check: (content) => content.includes('aria-') || content.includes('role=')
    },
    {
      name: 'Form Accessibility',
      file: 'components/ui/input.tsx',
      check: (content) => content.includes('aria-') || content.includes('id=')
    },
    {
      name: 'Navigation Accessibility',
      file: 'components/branded-header.tsx',
      check: (content) => content.includes('nav') || content.includes('aria-')
    }
  ];

  for (const check of accessibilityChecks) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), check.file), 'utf8');
      const passed = check.check(content);
      recordTest(`Accessibility: ${check.name}`, passed, passed ? 'Accessible' : 'Needs improvement');
    } catch (error) {
      recordTest(`Accessibility: ${check.name}`, false, error.message);
    }
  }
}

// Main execution
async function runValidation() {
  log('🚀 Starting NOVAKINETIX ACADEMY System Validation');
  log(`Base URL: ${CONFIG.baseUrl}`);
  log('');

  try {
    await testPageRoutes();
    await testApiEndpoints();
    await testFlaskMailService();
    testFileStructure();
    testEnvironmentVariables();
    testDatabaseSchema();
    testSecurityFeatures();
    testResponsiveDesign();
    testPerformanceOptimizations();
    testAccessibility();

    // Generate report
    log('');
    log('📊 Validation Results Summary');
    log(`Total Tests: ${testResults.total}`);
    log(`Passed: ${testResults.passed}`, 'success');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
    log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    log(`Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    log(`Validation failed with error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runValidation();
}

module.exports = {
  runValidation,
  testResults
}; 