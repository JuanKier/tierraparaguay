import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const logoPath = 'C:\\Users\\OMEN\\Desktop\\Tierrapy\\LOGO.jpeg';
const resPath = 'C:\\Users\\OMEN\\Desktop\\Tierrapy\\android\\app\\src\\main\\res';

const sizes = {
  'mipmap-hdpi': 72,
  'mipmap-mdpi': 48,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

Object.entries(sizes).forEach(async ([folder, size]) => {
  const outputPath = path.join(resPath, folder, 'ic_launcher.png');
  try {
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: ${outputPath}`);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
});

// Splash logo
try {
  await sharp(logoPath)
    .resize(300, 300)
    .png()
    .toFile(path.join(resPath, 'drawable', 'splash_logo.png'));
  console.log('Splash logo created');
} catch (err) {
  console.error(`Error splash: ${err}`);
}
