import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

const updateProduct = async (id, name, pain) => {
  const whatsapp_template = `Oi Joanderson! Acabei de fazer o meu diagnóstico e a IA detectou que a minha maior brecha hoje é a ${pain.toUpperCase()}. Quero saber mais detalhes sobre a ${name} para eu conseguir virar esse jogo!`;
  const thankyou_whatsapp_template = `Oi Joanderson! Acabei de garantir meu acesso na ${name} e queria saber qual é o próximo passo.`;
  await supabase.from('deep_funnel_products').update({ whatsapp_template, thankyou_whatsapp_template }).eq('id', id);
};

const run = async () => {
  const { data } = await supabase.from('deep_funnel_products').select('id, name, pain_tag');
  for (const p of data) {
    await updateProduct(p.id, p.name, p.pain_tag || p.name);
  }
  console.log("Updated", data.length, "products.");
}

run();
