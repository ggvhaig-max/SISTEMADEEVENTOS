import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("No Supabase URL/Key found in env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('--- INICIANDO PRUEBAS FUNCIONALES ---');
  
  // 1. SIGNUP CLIENTE NORMAL Y VERIFICACIÓN DE TRIGGER
  const randomId = Math.floor(Math.random() * 100000);
  const fakeVendedorEmail = `fake_vendedor_${randomId}@test.com`;
  const fakeVendedorPassword = 'TestPassword123!';

  console.log(`\nPrueba 1: Hacking Signup (intentando inyectar rol 'vendedor' por metadatos)`);
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: fakeVendedorEmail,
    password: fakeVendedorPassword,
    options: {
      data: {
        nombre: 'Intruso Vendedor',
        rol: 'vendedor' // INTENTAMOS FORZAR VENDEDOR AL CREAR LA CUENTA
      }
    }
  });

  if (signUpError) {
    console.log('Error signup:', signUpError.message);
  } else {
    console.log('Signup exitoso. ID:', signUpData.user?.id);
    
    // Check if the trigger forced him to be a 'cliente' instead of 'vendedor'
    // Since we are logged in as him, we can only see our own profile based on phase 1 RLS
    // Wait for trigger to finish propagating
    await new Promise(r => setTimeout(r, 2000));
    
    const { data: profile } = await supabase.from('usuarios_plataforma').select('*').eq('id', signUpData.user?.id).single();
    if (profile) {
      console.log('-> Rol resultante en BD (usuarios_plataforma):', profile.rol);
      if (profile.rol === 'cliente') {
        console.log('✅ EXITO: El trigger anuló el payload y forzó el rol "cliente" exitosamente.');
      } else {
        console.log('❌ FALLO: El rol quedó como', profile.rol);
      }
    } else {
        console.log('❌ FALLO: Perfil no encontrado (Quizás RLS impide su lectura o falló trigger).');
    }

    // Tenant Check
    const { data: myTenants } = await supabase.from('tenants').select('*');
    if (myTenants && myTenants.length > 0) {
      console.log(`-> Tenant creado exitosamente: "${myTenants[0].nombre}" en estado: "${myTenants[0].estado}"`);
      console.log('✅ EXITO: Trigger creó el tenant pivote inicial bajo rol cliente.');
    } else {
      console.log('❌ FALLO: No se creó el tenant inicial.');
    }
  }

  // 2. TENANT A NO PUEDE VER TENANT B (Aislamiento B2B)
  console.log(`\nPrueba 2: Aislamiento Tenant A vs Tenant B`);
  const { data: allTenants, error: tenantErr } = await supabase.from('tenants').select('id, nombre, estado');
  
  console.log(`-> Tenants detectados desde la vista del nuevo cliente: ${allTenants?.length}`);
  if (allTenants?.length === 1) {
    console.log('✅ EXITO: El RLS funciona. Solo puedo ver mi propio tenant recién creado y no los del resto de usuarios.');
  } else {
    console.log('❌ FALLO O ADVERTENCIA: RLS devolvió', allTenants?.length, 'tenants');
  }

  // Deslogueo para pruebas públicas
  await supabase.auth.signOut();

  // 3. CONSULTA PUBLICA BLOQUEADA EN RLS NATIVO
  console.log(`\nPrueba 3: Intento anónimo de leer tenants y eventos en RLS`);
  const { data: publicTenants, error: pubErr } = await supabase.from('tenants').select('*');
  const { data: publicEvents, error: pubErr2 } = await supabase.from('eventos').select('*');

  if (pubErr || publicTenants?.length === 0) {
    console.log('✅ EXITO: Un anónimo no puede leer Tenants (RLS blindado y array vacío o error).');
  } else {
    console.log('❌ FALLO: El anónimo leyó', publicTenants?.length, 'tenants.');
  }
  
  if (pubErr2 || publicEvents?.length === 0) {
    console.log('✅ EXITO: Un anónimo no puede leer Eventos (RLS blindado).');
  }

  // 4. EDGE FUNCTION: LOOKUP ENTRIES E ISLAMIENTO PUBLICO
  console.log(`\nPrueba 4: Acceso público exclusivo por Edge Functions (lookup-entries)`);
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/lookup-entries?email=correo-falso-que-no-existe@test.com&evento_id=123-falso`);
    const json = await res.json();
    console.log('-> Endpoint lookup-entries respondió con:', json);
    if (json.compras && json.compras.length === 0) {
        console.log('✅ EXITO: Consulta anónima fluyó por el Edge Function y retornó arreglo vacío sin tocar el RLS Nativo.');
    }
  } catch(e) {
    console.log('❌ FALLO al contactar Edge Function:', e);
  }

  // 5. EDGE FUNCTION: BLOQUEO POR TENANT VENCIDO (get-event-public)
  console.log(`\nPrueba 5: Prueba de bloqueo por tenant vencido o inventado`);
  try {
    const res2 = await fetch(`${supabaseUrl}/functions/v1/get-event-public?slug=slug-fantasma-invalido-o-vencido`);
    const json2 = await res2.json();
    console.log(`-> Repuesta get-event-public (slug inventado):`, json2);
    if (json2.error) {
       console.log(`✅ EXITO: La Edge Function cortó el flujo de acceso inseguro con error controlado.`);
    }
  } catch(e) {
    console.log('❌ FALLO al contactar Edge Function:', e);
  }

  console.log('\n--- FIN DE LAS PRUEBAS ---');
}

runTests();
