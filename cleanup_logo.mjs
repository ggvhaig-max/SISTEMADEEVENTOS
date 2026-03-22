import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirPath = path.join(__dirname, 'src');
const logoRegex = /<img[^>]*Diseno_sin_titulo\.png[^>]*>/gi;
const newLogo = '<span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">SISTEMA DE EVENTOS</span>';

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Diseno_sin_titulo')) {
        let newContent = content.replace(logoRegex, newLogo);
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Replaced in ${file}`);
      }
    }
  });
}

walkDir(dirPath);
