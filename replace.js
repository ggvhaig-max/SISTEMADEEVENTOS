const fs = require('fs');
const path = require('path');

const filesToCheck = [
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
];

const baseDir = "C:\\Users\\elpap\\Downloads\\nuevo programa de dolarito\\project";

filesToCheck.forEach(f => {
    const filePath = path.join(baseDir, f);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('alert(')) return;

    let lines = content.split('\n');
    const hasImport = content.includes("toast } from 'sonner'");

    if (!hasImport) {
        let insertIdx = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                insertIdx = i;
            }
        }
        lines.splice(insertIdx + 1, 0, "import { toast } from 'sonner';");
    }

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('alert(')) {
            if (lines[i].match(/alert\([`'"](.*?(error|debes|no se puede|no hay|selecciona|completa).*?)[`'"]\)/i) ||
                lines[i].match(/alert\(.*error.*\)/i) ||
                lines[i].includes('alert(`No se puede') ||
                lines[i].includes('alert(`Error') ||
                lines[i].includes('alert(`Números inválidos')) {
                lines[i] = lines[i].replace('alert(', 'toast.error(');
            } else if (lines[i].match(/alert\([`'"](.*?(exito|éxito|actualizado|creado|aprobada).*?)[`'"]\)/i)) {
                lines[i] = lines[i].replace('alert(', 'toast.success(');
            } else {
                lines[i] = lines[i].replace('alert(', 'toast(');
            }
        }
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
});
console.log("Reemplazo completado");
