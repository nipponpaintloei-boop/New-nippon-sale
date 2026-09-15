import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const iconSvg = fs.readFileSync(path.resolve('public/icon.svg'), 'utf-8');
const maskableSvg = fs.readFileSync(path.resolve('public/icon-maskable.svg'), 'utf-8');

function renderPng(svg, size, outputPath) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Rendered: ${outputPath} (${size}x${size})`);
}

renderPng(iconSvg, 512, path.resolve('public/pwa-512x512.png'));
renderPng(iconSvg, 192, path.resolve('public/pwa-192x192.png'));
renderPng(iconSvg, 180, path.resolve('public/apple-touch-icon.png'));
renderPng(maskableSvg, 512, path.resolve('public/pwa-maskable-512x512.png'));
renderPng(iconSvg, 32, path.resolve('public/favicon-32x32.png'));
renderPng(iconSvg, 64, path.resolve('public/favicon.ico'));
