import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { optimize } from "svgo";

const imagesDir = resolve(process.cwd(), "public/images");

console.log("🖼️  Optimizing images...\n");

async function optimizeImages() {
  try {
    console.log("📦 Optimizing background.png...");
    const bgPath = resolve(imagesDir, "background.png");
    const bgWebpPath = resolve(imagesDir, "background.webp");

    await sharp(bgPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(bgWebpPath);

    const originalSize = (await sharp(bgPath).metadata()).size;
    const webpSize = (await sharp(bgWebpPath).metadata()).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);

    console.log(`✅ background.png → background.webp`);
    console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   WebP: ${(webpSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Savings: ${savings}%\n`);

    console.log("📦 Optimizing logo-full.png...");
    const logoPath = resolve(imagesDir, "logo-full.png");
    const logoWebpPath = resolve(imagesDir, "logo-full.webp");

    await sharp(logoPath)
      .webp({ quality: 90, effort: 6 })
      .toFile(logoWebpPath);

    const logoOrigSize = (await sharp(logoPath).metadata()).size;
    const logoWebpSize = (await sharp(logoWebpPath).metadata()).size;
    const logoSavings = ((1 - logoWebpSize / logoOrigSize) * 100).toFixed(1);

    console.log(`✅ logo-full.png → logo-full.webp`);
    console.log(`   Original: ${(logoOrigSize / 1024).toFixed(2)} KB`);
    console.log(`   WebP: ${(logoWebpSize / 1024).toFixed(2)} KB`);
    console.log(`   Savings: ${logoSavings}%\n`);

    console.log("📦 Optimizing app-icon.svg...");
    const svgPath = resolve(imagesDir, "app-icon.svg");
    const svgContent = readFileSync(svgPath, "utf8");

    const result = optimize(svgContent, {
      multipass: true,
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
        },
        "removeScriptElement",
        "removeStyleElement",
      ],
    });

    writeFileSync(svgPath, result.data);

    const svgSavings = ((1 - result.data.length / svgContent.length) * 100).toFixed(1);
    console.log(`✅ app-icon.svg optimized`);
    console.log(`   Original: ${(svgContent.length / 1024).toFixed(2)} KB`);
    console.log(`   Optimized: ${(result.data.length / 1024).toFixed(2)} KB`);
    console.log(`   Savings: ${svgSavings}%\n`);

    console.log("🎉 All images optimized successfully!");
    console.log("\n📝 Note: Remember to update your code to use .webp images with PNG fallbacks");
  }
  catch (error) {
    console.error("❌ Error optimizing images:", error);
    process.exit(1);
  }
}

optimizeImages();
