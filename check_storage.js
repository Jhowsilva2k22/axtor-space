import { supabase } from "./src/integrations/supabase/client";

async function checkAndCreateBucket() {
  console.log("Verificando buckets...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Erro ao listar buckets:", listError.message);
    return;
  }

  console.log("Buckets encontrados:", buckets.map(b => b.name));

  const mediaExists = buckets.some(b => b.name === 'media');

  if (!mediaExists) {
    console.log("Tentando criar bucket 'media'...");
    const { data, error } = await supabase.storage.createBucket('media', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    if (error) {
      console.error("Erro ao criar bucket:", error.message);
      console.log("DICA: Crie manualmente um bucket chamado 'media' como PUBLIC no seu painel do Supabase.");
    } else {
      console.log("Bucket 'media' criado com sucesso!");
    }
  } else {
    console.log("Bucket 'media' já existe.");
  }
}

checkAndCreateBucket();
