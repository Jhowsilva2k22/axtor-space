// Presets de bio prontos por nicho.
// Cada preset cria N categorias + N blocos no tenant atual.
// Aplicado via botão no Admin (estado vazio).

export type BioTemplateBlock = {
  kind: string;
  label: string;
  description?: string;
  url: string;
  icon: string;
  highlight?: boolean;
  use_brand_color?: boolean;
  badge?: string;
  category_slug?: string; // referência à categoria do mesmo template
};

export type BioTemplateCategory = {
  name: string;
  slug: string;
  icon?: string;
};

export type BioTemplate = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  headline: string;
  sub_headline?: string;
  categories: BioTemplateCategory[];
  blocks: BioTemplateBlock[];
};

export const BIO_TEMPLATES: BioTemplate[] = [
  {
    id: "coach",
    name: "Coach / Mentor",
    emoji: "🎯",
    description: "Para coaches, mentores e terapeutas — destaque a sessão e os conteúdos.",
    headline: "Ajudo pessoas a destravarem o próximo passo com clareza e propósito.",
    sub_headline: "Mentoria 1:1 · grupos · conteúdo gratuito",
    categories: [
      { name: "Trabalhe comigo", slug: "trabalhe-comigo", icon: "Briefcase" },
      { name: "Conteúdo gratuito", slug: "conteudo", icon: "BookOpen" },
      { name: "Conecte", slug: "conecte", icon: "Heart" },
    ],
    blocks: [
      {
        kind: "whatsapp",
        label: "Agendar sessão",
        description: "Converse comigo no WhatsApp",
        url: "https://wa.me/55SEUNUMERO",
        icon: "MessageCircle",
        highlight: true,
        use_brand_color: true,
        badge: "novo",
        category_slug: "trabalhe-comigo",
      },
      {
        kind: "calendar",
        label: "Agendar diagnóstico gratuito",
        url: "https://calendly.com/seu-link",
        icon: "Calendar",
        category_slug: "trabalhe-comigo",
      },
      {
        kind: "youtube",
        label: "Canal no YouTube",
        description: "Vídeos novos toda semana",
        url: "https://youtube.com/@seu-canal",
        icon: "Youtube",
        category_slug: "conteudo",
      },
      {
        kind: "spotify",
        label: "Podcast no Spotify",
        url: "https://open.spotify.com/show/...",
        icon: "Music",
        category_slug: "conteudo",
      },
      {
        kind: "instagram",
        label: "Me siga no Instagram",
        url: "https://instagram.com/seu-handle",
        icon: "Instagram",
        category_slug: "conecte",
      },
    ],
  },
  {
    id: "artist",
    name: "Artista / Criador",
    emoji: "🎨",
    description: "Música, arte, fotografia — vitrine para portfólio e plataformas.",
    headline: "Criando arte que conecta — siga o trabalho e venha ouvir.",
    sub_headline: "Streaming · shows · loja oficial",
    categories: [
      { name: "Ouça agora", slug: "ouca", icon: "Music" },
      { name: "Assista", slug: "assista", icon: "Video" },
      { name: "Loja", slug: "loja", icon: "ShoppingBag" },
    ],
    blocks: [
      {
        kind: "spotify",
        label: "Spotify",
        description: "Novo single já disponível",
        url: "https://open.spotify.com/artist/...",
        icon: "Music",
        highlight: true,
        use_brand_color: true,
        badge: "novo",
        category_slug: "ouca",
      },
      {
        kind: "link",
        label: "Apple Music",
        url: "https://music.apple.com/...",
        icon: "Music",
        category_slug: "ouca",
      },
      {
        kind: "youtube",
        label: "Clipe oficial",
        url: "https://youtube.com/watch?v=...",
        icon: "Youtube",
        category_slug: "assista",
      },
      {
        kind: "instagram",
        label: "Instagram",
        url: "https://instagram.com/seu-handle",
        icon: "Instagram",
        category_slug: "assista",
      },
      {
        kind: "site",
        label: "Loja oficial",
        description: "Camisetas, vinis e mais",
        url: "https://sualoja.com",
        icon: "ShoppingBag",
        category_slug: "loja",
      },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce / Loja",
    emoji: "🛍️",
    description: "Para lojas online — coleções, atendimento e novidades.",
    headline: "Sua próxima peça favorita está a um clique.",
    sub_headline: "Frete grátis acima de R$199 · troca fácil",
    categories: [
      { name: "Compre agora", slug: "compre", icon: "ShoppingBag" },
      { name: "Atendimento", slug: "atendimento", icon: "MessageCircle" },
      { name: "Coleções", slug: "colecoes", icon: "Layers" },
    ],
    blocks: [
      {
        kind: "site",
        label: "Acessar loja",
        description: "Catálogo completo",
        url: "https://sualoja.com",
        icon: "ShoppingBag",
        highlight: true,
        use_brand_color: true,
        category_slug: "compre",
      },
      {
        kind: "link",
        label: "Promoções da semana",
        url: "https://sualoja.com/promocoes",
        icon: "Tag",
        badge: "promo",
        category_slug: "compre",
      },
      {
        kind: "whatsapp",
        label: "WhatsApp da loja",
        description: "Tira dúvidas e faz pedido",
        url: "https://wa.me/55SEUNUMERO",
        icon: "MessageCircle",
        category_slug: "atendimento",
      },
      {
        kind: "instagram",
        label: "Lookbook no Instagram",
        url: "https://instagram.com/sua-loja",
        icon: "Instagram",
        category_slug: "colecoes",
      },
      {
        kind: "link",
        label: "Nova coleção",
        description: "Outono/Inverno",
        url: "https://sualoja.com/colecao",
        icon: "Sparkles",
        badge: "novo",
        category_slug: "colecoes",
      },
    ],
  },
  {
    id: "infoproduct",
    name: "Infoprodutor / Curso",
    emoji: "📚",
    description: "Cursos, ebooks e mentorias — funil claro e prova social.",
    headline: "Aprenda o método que transformou +500 alunos.",
    sub_headline: "Aulas práticas · suporte ativo · acesso vitalício",
    categories: [
      { name: "Quero o curso", slug: "curso", icon: "GraduationCap" },
      { name: "Materiais grátis", slug: "gratis", icon: "Gift" },
      { name: "Comunidade", slug: "comunidade", icon: "Users" },
    ],
    blocks: [
      {
        kind: "site",
        label: "Garantir minha vaga",
        description: "Turma com vagas limitadas",
        url: "https://seucurso.com/checkout",
        icon: "GraduationCap",
        highlight: true,
        use_brand_color: true,
        badge: "vagas",
        category_slug: "curso",
      },
      {
        kind: "link",
        label: "Conheça o método",
        url: "https://seucurso.com",
        icon: "FileText",
        category_slug: "curso",
      },
      {
        kind: "link",
        label: "Ebook gratuito",
        description: "Os 5 erros que travam o resultado",
        url: "https://seucurso.com/ebook",
        icon: "Download",
        badge: "grátis",
        category_slug: "gratis",
      },
      {
        kind: "youtube",
        label: "Aula introdutória",
        url: "https://youtube.com/watch?v=...",
        icon: "Youtube",
        category_slug: "gratis",
      },
      {
        kind: "whatsapp",
        label: "Grupo de alunos no WhatsApp",
        url: "https://chat.whatsapp.com/...",
        icon: "Users",
        category_slug: "comunidade",
      },
    ],
  },
];