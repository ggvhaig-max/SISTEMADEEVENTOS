import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type CompraEstado = 'pendiente' | 'aprobada' | 'rechazada';

interface DeletePurchaseRequest {
  compra_id?: string;
}

interface CompraRow {
  id: string;
  estado: CompraEstado;
  comprobante_url: string | null;
}

function getReceiptPath(comprobanteUrl: string, supabaseUrl: string): string | null {
  try {
    const url = new URL(comprobanteUrl);
    const basePath = `${new URL(supabaseUrl).pathname}/storage/v1/object/public/comprobantes/`;

    if (!url.pathname.startsWith(basePath)) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(basePath.length));
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { compra_id }: DeletePurchaseRequest = await req.json();

    if (!compra_id) {
      return new Response(JSON.stringify({ error: 'compra_id es requerido' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .select('id, estado, comprobante_url')
      .eq('id', compra_id)
      .single<CompraRow>();

    if (compraError || !compra) {
      return new Response(JSON.stringify({ error: 'Compra no encontrada' }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    if (compra.estado === 'aprobada') {
      return new Response(
        JSON.stringify({
          error: 'No se puede eliminar una compra aprobada porque ya tiene números asignados.',
        }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (compra.estado === 'pendiente') {
      const { error: releaseError } = await supabase
        .from('entradas')
        .update({
          estado: 'disponible',
          correo_comprador: null,
          compra_id: null,
          nombre_comprador: null,
          telefono: null,
          documento: null,
          pais: null,
          ciudad: null,
        })
        .eq('compra_id', compra_id);

      if (releaseError) {
        throw new Error(`No se pudieron liberar las boletas reservadas: ${releaseError.message}`);
      }
    }

    if (compra.comprobante_url) {
      const receiptPath = getReceiptPath(compra.comprobante_url, supabaseUrl);

      if (receiptPath) {
        const { error: storageError } = await supabase.storage
          .from('comprobantes')
          .remove([receiptPath]);

        if (storageError) {
          throw new Error(`No se pudo eliminar el comprobante asociado: ${storageError.message}`);
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('compras')
      .delete()
      .eq('id', compra_id);

    if (deleteError) {
      throw new Error(`No se pudo eliminar la transacción: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno al eliminar la compra' }),
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
