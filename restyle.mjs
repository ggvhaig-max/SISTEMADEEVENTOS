import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';

// Mapa de reemplazos exactos y Regex
const replacements = [
  // Fondos y Gradientes Base Oscuros -> Claros
  { regex: /bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900/g, replacement: 'bg-gradient-to-br from-slate-50 via-white to-orange-50/30' },
  { regex: /bg-gradient-to-br from-gray-800 to-gray-900/g, replacement: 'bg-gradient-to-br from-white to-slate-50' },
  { regex: /bg-gray-900/g, replacement: 'bg-slate-50' },
  
  // Elementos Tarjetas y Contenedores (A Glassmorphism)
  // Reemplazamos bg-gray-800 por Glassmorphism
  { regex: /bg-gray-800/g, replacement: 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm' },
  { regex: /bg-gray-800\/50/g, replacement: 'bg-white/40 backdrop-blur-md border border-white/30' },
  { regex: /bg-gray-700/g, replacement: 'bg-slate-100' },
  { regex: /bg-gray-600/g, replacement: 'bg-slate-200' },

  // Textos y Títulos (Oscuros a Claros)
  // ¡Cuidado de no machacar textos que deben ir sobre colores fuertes!
  // Evitamos modificar text-white si está cerca de un botón bg-blue, bg-orange, etc. Pero de manera simple, vamos a cambiar text-gray
  { regex: /text-gray-100/g, replacement: 'text-slate-800' },
  { regex: /text-white/g, replacement: 'text-slate-900' }, // Modificaremos los botones más adelante para restaurar su text-white
  { regex: /text-gray-200/g, replacement: 'text-slate-800' },
  { regex: /text-gray-300/g, replacement: 'text-slate-600' },
  { regex: /text-gray-400/g, replacement: 'text-slate-500' },
  { regex: /text-gray-500/g, replacement: 'text-slate-400' },

  // Bordes
  { regex: /border-gray-700/g, replacement: 'border-white/50' },
  { regex: /border-gray-800/g, replacement: 'border-white/60' },
  { regex: /divide-gray-700/g, replacement: 'divide-slate-200/50' },
  { regex: /divide-gray-800/g, replacement: 'divide-slate-200' },

  // Acentos (Azul / Indigo -> Naranja / Ambar)
  { regex: /bg-blue-600/g, replacement: 'bg-orange-500' },
  { regex: /bg-blue-500/g, replacement: 'bg-orange-500' },
  { regex: /hover:bg-blue-700/g, replacement: 'hover:bg-orange-600' },
  { regex: /text-blue-500/g, replacement: 'text-orange-500' },
  { regex: /text-blue-400/g, replacement: 'text-orange-500' },
  { regex: /focus:ring-blue-500/g, replacement: 'focus:ring-orange-500' },
  { regex: /border-blue-500/g, replacement: 'border-orange-500' },
  { regex: /from-blue-600/g, replacement: 'from-orange-500' },
  { regex: /to-indigo-600/g, replacement: 'to-amber-500' },
  { regex: /from-blue-500/g, replacement: 'from-orange-500' },
  { regex: /from-blue-400/g, replacement: 'from-orange-400' },
  { regex: /to-indigo-500/g, replacement: 'to-amber-500' },
  { regex: /bg-blue-500\/10/g, replacement: 'bg-orange-500/10' },
  { regex: /bg-blue-500\/20/g, replacement: 'bg-orange-500/20' },
  { regex: /text-indigo-400/g, replacement: 'text-amber-500' },

  // Ajustes de Hover de enlaces en Sidebars o Botones fantasma
  { regex: /hover:bg-gray-700/g, replacement: 'hover:bg-orange-50' },
  { regex: /hover:bg-gray-800/g, replacement: 'hover:bg-white/60' },
  { regex: /hover:text-white/g, replacement: 'hover:text-orange-600' },

  // Ajuste especial para botones de accion primaria (que perdieron text-white)
  { regex: /bg-orange-500 hover:bg-orange-600 text-slate-900/g, replacement: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20' },
  { regex: /bg-orange-600 hover:bg-orange-700 text-slate-900/g, replacement: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { regex: /bg-green-600 hover:bg-green-700 text-slate-900/g, replacement: 'bg-green-500 hover:bg-green-600 text-white shadow-md' },
  { regex: /bg-red-600 hover:bg-red-700 text-slate-900/g, replacement: 'bg-red-500 hover:bg-red-600 text-white shadow-md' },
  { regex: /text-slate-900 font-medium py/g, replacement: 'text-white font-medium py' }, // Patrón típico de botón primario
  { regex: /text-slate-900 px-4 py-2/g, replacement: 'text-white px-4 py-2' }
];

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') console.warn(`Ignorando ${dirFile}`);
    }
  });
  return filelist;
}

const files = walkSync(SRC_DIR).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
console.log('Restyling completado.');
