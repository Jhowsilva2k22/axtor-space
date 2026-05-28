import { createClient } from 'npm:@supabase/supabase-js@2'
import { captureException } from '../_shared/sentry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://axtor.space',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // O user ID vem APENAS do JWT verificado — nunca do body da requisição.
    // Isso garante isolamento absoluto: um usuário jamais pode deletar dados de outro.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cliente com o JWT do usuário — só para verificar a identidade
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // A partir daqui, TODOS os deletes usam user.id como filtro obrigatório.
    // Nenhuma outra fonte de ID é aceita.
    const ownUserId = user.id

    // Cliente admin — usado apenas para operações que precisam de service_role
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Remove roles do usuário (não tem FK cascade para auth.users em public)
    const { error: rolesError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', ownUserId)

    if (rolesError) {
      console.error('[delete-account] user_roles error:', rolesError)
      return new Response(JSON.stringify({ error: 'Falha ao remover permissões' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Remove os tenants do usuário (cascade derruba todos os dados vinculados:
    //    bio_config, bio_blocks, leads, funnel_events, page_views, etc.)
    //    O filtro .eq('owner_user_id', ownUserId) garante que apenas os tenants
    //    deste usuário são afetados — nunca dados de outro.
    const { error: tenantsError } = await adminClient
      .from('tenants')
      .delete()
      .eq('owner_user_id', ownUserId)

    if (tenantsError) {
      console.error('[delete-account] tenants error:', tenantsError)
      return new Response(JSON.stringify({ error: 'Falha ao excluir dados do tenant' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Remove a conta de autenticação (auth.admin.deleteUser é irreversível)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(ownUserId)
    if (deleteError) {
      console.error('[delete-account] auth.admin.deleteUser error:', deleteError)
      return new Response(JSON.stringify({ error: 'Falha ao excluir conta' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    await captureException(err, { function: 'delete-account' })
    console.error('[delete-account] unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
