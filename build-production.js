const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Step 1: Building Frontend Vue App ===');
try {
  execSync('npm run build --prefix frontend', { stdio: 'inherit' });
  console.log('Frontend build successful!\n');
} catch (error) {
  console.error('Frontend build failed:', error);
  process.exit(1);
}

console.log('=== Step 2: Syncing Assets to Laravel Public Directory ===');
const distDir = path.resolve(__dirname, 'frontend/dist');
const publicDir = path.resolve(__dirname, 'backend/public');

// Helper to recursively copy directories/files safely
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // Prevent overwriting Laravel core public files
    const basename = path.basename(dest);
    if (basename === 'index.php' || basename === '.htaccess') {
      console.log(`Skipping core file: ${basename}`);
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

// Clean old assets
const assetsDest = path.join(publicDir, 'assets');
if (fs.existsSync(assetsDest)) {
  console.log('Removing old assets folder...');
  fs.rmSync(assetsDest, { recursive: true, force: true });
}

console.log('Copying new dist files to public folder...');
copyRecursiveSync(distDir, publicDir);
console.log('Sync complete!\n');

console.log('=== Production Build Finished Successfully ===');
console.log('You can now run the app via Laravel server using "php artisan serve"!');
