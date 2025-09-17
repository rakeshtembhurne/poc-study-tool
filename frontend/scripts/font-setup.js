import https from 'https';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up local fonts for the team...');

// Font configurations
const fonts = [
  {
    name: 'GeistVF.woff2',
    url: 'https://github.com/vercel/geist-font/releases/download/1.3.0/Geist.zip',
    dir: 'geist-sans',
    extractPath: 'Geist/fonts/woff2/GeistVF.woff2',
  },
  {
    name: 'GeistMonoVF.woff2',
    url: 'https://github.com/vercel/geist-font/releases/download/1.3.0/GeistMono.zip',
    dir: 'geist-mono',
    extractPath: 'GeistMono/fonts/woff2/GeistMonoVF.woff2',
  },
];

// Create fonts directory structure
const fontsDir = path.join(process.cwd(), 'public', 'fonts');
console.log(`📁 Creating fonts directory: ${fontsDir}`);

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Function to download and extract font
async function downloadFont(font) {
  const fontDir = path.join(fontsDir, font.dir);
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir, { recursive: true });
  }

  const filePath = path.join(fontDir, font.name);

  // Skip if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`✅ Font ${font.name} already exists, skipping...`);
    return Promise.resolve();
  }

  console.log(`⬇️  Downloading ${font.name}...`);

  return new Promise((resolve, reject) => {
    // For simplicity, we'll download the direct font files
    // You can implement zip extraction if needed
    const directUrls = {
      'GeistVF.woff2':
        'https://github.com/vercel/geist-font/raw/main/dist/fonts/geist-sans/GeistVF.woff2',
      'GeistMonoVF.woff2':
        'https://github.com/vercel/geist-font/raw/main/dist/fonts/geist-mono/GeistMonoVF.woff2',
    };

    const directUrl = directUrls[font.name];
    if (!directUrl) {
      console.log(`❌ No direct URL for ${font.name}`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(filePath);

    https
      .get(directUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          https
            .get(response.headers.location, (redirectResponse) => {
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded ${font.name}`);
                resolve();
              });
            })
            .on('error', reject);
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`✅ Downloaded ${font.name}`);
            resolve();
          });
        }
      })
      .on('error', (err) => {
        console.error(`❌ Error downloading ${font.name}:`, err.message);
        fs.unlink(filePath, () => {}); // Delete partial file
        reject(err);
      });
  });
}

// Download all fonts
async function setupFonts() {
  try {
    for (const font of fonts) {
      await downloadFont(font);
    }

    console.log('🎉 Font setup completed successfully!');
    console.log('📋 Fonts installed:');
    console.log('   • Geist Sans Variable Font');
    console.log('   • Geist Mono Variable Font');
    console.log('');
    console.log(
      '✨ Your app will now use local fonts instead of Google Fonts CDN'
    );
  } catch (error) {
    console.error('❌ Font setup failed:', error.message);
    console.log('');
    console.log('🔧 Manual setup required:');
    console.log(
      '1. Download fonts from: https://github.com/vercel/geist-font/releases'
    );
    console.log('2. Extract and place in public/fonts/ directory');
    process.exit(1);
  }
}

setupFonts();
