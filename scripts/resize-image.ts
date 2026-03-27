import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = 'C:/Users/drobi/.gemini/antigravity/brain/6752a81c-dddd-464c-a408-64df72d4c26a/rayon_master_preview_v2_png_1774641185896.png';
const output = path.join(__dirname, '../twa_preview_640x360.png');

async function resize() {
  try {
    await sharp(input)
      .resize(640, 360, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(output);
    console.log('✅ Изображение успешно обрезано до 640x360: ' + output);
  } catch (err) {
    console.error('❌ Ошибка при обработке:', err);
  }
}

resize();
