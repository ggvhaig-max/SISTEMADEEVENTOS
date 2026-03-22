import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const documento = url.searchParams.get('documento');
    const evento_id = url.searchParams.get('evento_id');
    const compra_id = url.searchParams.get('compra_id');

    if (!email && !documento && !compra_id) {
      return new Response(
        JSON.stringify({ error: 'Falta parámetro de búsqueda (email, documento o ID)' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let comprasQuery = supabase
      .from('compras')
      .select(`
        *,
        eventos:evento_id(nombre, slug),
        entradas:entradas(id, numero_entrada, es_bendecida, premio_valor, estado)
      `);

    if (email) {
      comprasQuery = comprasQuery.eq('correo_comprador', email);
    } else if (documento) {
      comprasQuery = comprasQuery.eq('documento_numero', documento);
    }

    if (evento_id) {
      comprasQuery = comprasQuery.eq('evento_id', evento_id);
    }

    if (compra_id) {
      comprasQuery = comprasQuery.eq('id', compra_id);
    }

    comprasQuery = comprasQuery.order('created_at', { ascending: false });

    const { data: compras } = await comprasQuery;

    return new Response(
      JSON.stringify({
        compras: compras || [],
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
