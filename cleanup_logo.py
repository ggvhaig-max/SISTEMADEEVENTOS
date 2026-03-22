import os
import re

dir_path = r"C:\Users\elpap\Downloads\nuevo programa de dolarito\project\src"
logo_regex = re.compile(r'<img[^>]*Diseno_sin_titulo\.png[^>]*>', re.IGNORECASE | re.MULTILINE | re.DOTALL)
new_logo = r'<span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">SISTEMA DE EVENTOS</span>'

for root, dirs, files in os.walk(dir_path):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            if 'Diseno_sin_titulo' in content:
                new_content = logo_regex.sub(new_logo, content)
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Reemplazado en {f}")
