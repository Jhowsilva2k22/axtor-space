
import { createClient } from '@supabase/supabase-js';

const supabase = createClient("https://bdxkcfngskagriaapepo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkeGtjZm5nc2thZ3JpYWFwZXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTc4NzMsImV4cCI6MjA5MjM5Mzg3M30.w-KTLrUYHyvhg7bJVMvgoQ_P-G001NH9cDLo0tuCfQc");

const newBio = `Stefany Mello é estrategista de posicionamento e gestão digital para negócios premium.\n\nCom visão estratégica e execução orientada a resultado, desenvolve e gerencia estratégias digitais que transformam a presença online de negócios em um ativo comercial real capaz de gerar autoridade, atrair o cliente certo e justificar o preço cobrado.\n\nSua metodologia une posicionamento estratégico, gestão de conteúdo e inteligência editorial para construir uma presença digital consistente, intencional e alinhada ao nível do negócio que representa.\n\nDiretora da Axtor, braço de produção e tecnologia do ecossistema, Stefany lidera uma operação que une estratégia de marca, produção de conteúdo premium, cobertura de eventos e soluções com inteligência artificial aplicada ao marketing.`;

async function updateBio() {
  const { data, error } = await supabase
    .from('bio_config')
    .update({ 
      headline: newBio,
      sub_headline: "Para quem entendeu que presença digital não é sobre estar online. É sobre ser escolhido."
    })
    .eq('display_name', 'Stefany Mello');
    
  if (error) console.error('Error:', error);
  else console.log('Bio updated successfully in DB!');
}

updateBio();
