import os
import re

files_to_check = [
    "src/pages/vendedor/RegistrarPagoSaaS.tsx",
    "src/pages/superadmin/SuperAdminTenants.tsx",
    "src/pages/superadmin/SuperAdminPagos.tsx",
    "src/pages/superadmin/SuperAdminComisiones.tsx",
    "src/pages/public/MyTicketPage.tsx",
    "src/pages/public/EventLanding.tsx",
    "src/pages/admin/EditEventPage.tsx",
    "src/pages/admin/EventEntriesPage.tsx",
    "src/pages/admin/EventosPage.tsx",
    "src/pages/admin/PackagesPage.tsx",
    "src/pages/admin/PurchasesPage.tsx",
    "src/pages/admin/WinnersPage.tsx",
    "src/pages/admin/PrizesPage.tsx",
    "src/pages/admin/BlessedNumbersPage.tsx",
    "src/pages/admin/CreateEventPage.tsx",
    "src/components/LicenciaInactiva.tsx",
    "src/components/ImageUpload.tsx",
    "src/components/PurchaseModal.tsx"
]

base_dir = r"C:\Users\elpap\Downloads\nuevo programa de dolarito\project"

for f in files_to_check:
    path = os.path.join(base_dir, f)
    if not os.path.exists(path): continue
    
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if "alert(" not in content:
        continue
        
    lines = content.split('\n')
    has_import = "import { toast } from 'sonner'" in content
    
    if not has_import:
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_idx = i
        lines.insert(insert_idx + 1, "import { toast } from 'sonner';")
        
    for i in range(len(lines)):
        if "alert(" in lines[i]:
            if re.search(r"alert\([r']?['`\"](?i:error|debes|no se puede|no hay|selecciona|completa).*?['`\"]\)", lines[i]) or \
               re.search(r"alert\(.*?error.*?\)", lines[i].lower()) or \
               "alert(`No se puede" in lines[i] or \
               "alert(`Error" in lines[i] or \
               "alert(`Números inválidos" in lines[i]:
                lines[i] = lines[i].replace("alert(", "toast.error(")
            elif re.search(r"alert\(['`\"](?i:exito|éxito|actualizado|creado).*?['`\"]\)", lines[i]):
                lines[i] = lines[i].replace("alert(", "toast.success(")
            else:
                lines[i] = lines[i].replace("alert(", "toast(")
                
    with open(path, 'w', encoding='utf-8') as file:
        file.write('\n'.join(lines))
