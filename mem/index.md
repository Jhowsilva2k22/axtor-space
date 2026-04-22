# Project Memory

## Core
Estética: Luxury Editorial (Prada/Armani). Linhas retas com curvatura quase imperceptível — usar `rounded-sm` (radius global 0.1875rem). NUNCA `rounded-full` ou `rounded-lg/xl/2xl` em badges, botões, cards, inputs ou containers. Exceção única: avatares circulares (foto de perfil) e loaders.
Tipografia: Cormorant Garamond (display/headings) + Manrope (body, peso 300). Botões em uppercase com tracking wide (0.15em).
Paleta: dourado sobre fundo escuro. Usar tokens semânticos (border-gold, text-gold, bg-gradient-gold-soft, etc.) — nunca cores hardcoded.
Toda nova UI deve seguir essa regra sem exceção.
Admin único: contatojhow@icloud.com (role admin via tabela user_roles + has_role). Login em /admin/login, painel em /admin. Bio pública em /bio (controlada pelo admin via tabelas bio_config + bio_blocks).
CTA final do diagnóstico = funil 3 camadas: (1) Ver bio do Joanderson → /bio; (2) Quero um link-in-bio assim → /bio#blocks; (3) Quero estratégia personalizada → WhatsApp. Nunca nichar em "mentoria".
IA do diagnóstico = postura de estrategista de mercado (não consultor genérico). Detecta nicho, traz benchmarks, faixa qualitativa (Crítico/Tem potencial/Forte/Excelente) e veredicto com frase-bomba.

## Memories
- [Design rules](mem://design/rules) — Detalhes de radius, tipografia, badges, botões e exceções
