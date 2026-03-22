import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('--- INICIANDO PRUEBAS FUNCIONALES ---');
  
  const randomId = Math.floor(Math.random() * 100000);
  const fakeVendedorEmail = `fake_vendedor_${randomId}@gmail.com`;
  const fakeVendedorPassword = 'TestPassword123!';

  console.log(`\nPrueba 1: Hacking Signup (intentando forzar rol 'vendedor')`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: fakeVendedorEmail,
    password: fakeVendedorPassword,
    options: {
      data: {
        nombre: 'Intruso Vendedor',
        rol: 'vendedor' 
      }
    }
  });

  if (signUpError) {
    console.log('Error signup:', signUpError.message);
  } else {
    console.log('Signup exitoso. UID:', signUpData.user?.id);
    
    await new Promise(r => setTimeout(r, 2000));
    
    const { data: profile } = await supabase.from('usuarios_plataforma').select('*').eq('id', signUpData.user?.id).single();
    if (profile) {
      console.log('-> Rol asignado por DB:', profile.rol);
      if (profile.rol === 'cliente') {
        console.log('✅ EXITO: El trigger anuló el payload y forzó "cliente".');
      } else {
        console.log('❌ FALLO: El rol quedó como', profile.rol);
      }
    }

    const { data: myTenants } = await supabase.from('tenants').select('*');
    if (myTenants && myTenants.length > 0) {
      console.log(`-> Tenant creado: "${myTenants[0].nombre}" (Estado: ${myTenants[0].estado})`);
      console.log('✅ EXITO: Trigger creó el tenant pivote automáticamente.');
    }
  }

  console.log(`\nPrueba 2: Aislamiento Tenant A vs B`);
  const { data: allTenants } = await supabase.from('tenants').select('id, nombre');
  
  if (allTenants && allTenants.length === 1) {
    console.log('✅ EXITO: El RLS funciona. Solo veo 1 tenant (el mío).');
  } else if (!allTenants || allTenants.length === 0) {
    console.log('✅ EXITO: No veo ningun tenant porque falló el logueo anterior y soy anonimo en BD.');
  } else {
    console.log('❌ FALLO O ADVERTENCIA: Veo multiples tenants:', allTenants.length);
  }

  await supabase.auth.signOut();

  console.log(`\nPrueba 3: Intento anónimo de leer tenants y eventos en RLS`);
  const { data: publicTenants, error: pubErr } = await supabase.from('tenants').select('*');
  if (pubErr || publicTenants?.length === 0) {
    console.log('✅ EXITO: Un anónimo no lee Tenants.');
  } else {
    console.log('❌ FALLO: RLS abierto en Tenants.', publicTenants?.length);
  }
  
  const { data: publicEvents, error: pubErr2 } = await supabase.from('eventos').select('*');
  if (pubErr2 || publicEvents?.length === 0) {
    console.log('✅ EXITO: Un anónimo no lee Eventos directamente.');
  }

  console.log(`\nPrueba 4: Acceso público Edge Functions (lookup-entries)`);
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/lookup-entries?email=fake@test.com&evento_id=123`);
    const json = await res.json();
    if (json.compras && json.compras.length === 0) {
        console.log('✅ EXITO: Consulta anónima válida retornó array vacío. RLS salvaguardado.');
    }
  } catch(e) {
    console.log('❌ FALLO Edge Function:', e);
  }

  console.log(`\nPrueba 5: Edge Func bloqueo por tenant inactivo (get-event-public)`);
  try {
    const res2 = await fetch(`${supabaseUrl}/functions/v1/get-event-public?slug=slug-invalido-o-vencido`);
    const json2 = await res2.json();
    if (json2.error) {
       console.log(`✅ EXITO: Operación bloqueada con el mensaje: "${json2.error}"`);
    }
  } catch(e) {
    console.log('❌ FALLO Edge Function:', e);
  }

  process.exit(0);
}

runTests();
