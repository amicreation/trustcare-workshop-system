const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Step 1: Building Frontend Assets ===');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Frontend build successful!\n');
} catch (error) {
  console.error('Frontend build failed! Please check your Node/Vite setup.\n');
  process.exit(1);
}

console.log('=== Step 2: Checking Composer Vendor Directory ===');
if (!fs.existsSync(path.join(__dirname, 'vendor'))) {
  console.log('"vendor" directory not found. Running "composer install" to pull dependencies...');
  try {
    execSync('composer install', { stdio: 'inherit' });
    console.log('Composer dependencies installed successfully!\n');
  } catch (error) {
    console.error('Composer install failed. Please make sure composer is installed and run it manually.\n');
    process.exit(1);
  }
} else {
  console.log('"vendor" directory is present.');
}

console.log('=== Step 3: Preparing Release Package ===');
const zipFile = path.join(__dirname, 'release.zip');
if (fs.existsSync(zipFile)) {
  console.log('Removing old release.zip...');
  fs.unlinkSync(zipFile);
}

// Ensure the storage subdirectories exist so they are zipped properly
const storageDirs = [
  'storage/app',
  'storage/app/public',
  'storage/framework',
  'storage/framework/cache',
  'storage/framework/cache/data',
  'storage/framework/sessions',
  'storage/framework/views',
  'storage/logs'
];
storageDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  // Place a placeholder .gitkeep if empty to ensure the directory is created
  try {
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
      fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');
    }
  } catch (err) {
    // Ignore read/write errors
  }
});

console.log('Packaging files into release.zip...');
try {
  // Exclude node_modules, local sqlite database, local .env, caches, and configuration tooling
  const excludePatterns = [
    'node_modules/*',
    'node_modules',
    '.git/*',
    '.git',
    '.github/*',
    '.env',
    'release.zip',
    '.phpunit.result.cache',
    'tests/*',
    'phpunit.xml',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vite.config.ts',
    'eslint.config.js',
    'database/database.sqlite',
    'storage/logs/*',
    'storage/framework/cache/data/*',
    'storage/framework/sessions/*',
    'storage/framework/views/*'
  ];

  const excludeFlags = excludePatterns.map(pattern => `-x "${pattern}"`).join(' ');
  execSync(`zip -r release.zip . ${excludeFlags}`, { stdio: 'ignore' });
  
  console.log('\n==================================================');
  console.log('SUCCESS: release.zip created successfully!');
  console.log(`Size: ${(fs.statSync(zipFile).size / (1024 * 1024)).toFixed(2)} MB`);
  console.log('==================================================');
  console.log('\nDeployment Steps:');
  console.log('1. Upload "release.zip" to Hostinger (inside public_html or root).');
  console.log('2. Extract the zip file using Hostinger File Manager.');
  console.log('3. Copy and edit ".env.example" to ".env" on Hostinger and update DB credentials.');
  console.log('4. Generate app key: "php artisan key:generate" (or copy from local .env).');
  console.log('5. Trigger database migrations.');
} catch (error) {
  console.error('Packaging failed:', error.message);
  process.exit(1);
}
