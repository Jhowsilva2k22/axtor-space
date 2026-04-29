import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Política de Privacidade — Axtor Space.
 *
 * Texto base em conformidade com a LGPD (Lei 13.709/2018):
 *  - Art. 7 (bases legais)
 *  - Art. 9 (informação ao titular)
 *  - Art. 18 (direitos do titular)
 *  - Art. 41 (encarregado de dados)
 *
 * Esta versão é um ponto de partida razoável. Antes de operar com volume,
 * recomenda-se revisão jurídica especializada.
 */

const Privacidade = () => {
  const lastUpdate = "28 de abril de 2026";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> voltar
        </Link>

        <header className="mb-10">
          <h1 className="font-display text-4xl">Política de Privacidade</h1>
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Última atualização: {lastUpdate}
          </p>
        </header>

        <article className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl text-primary">1. Quem somos</h2>
            <p className="mt-2">
              <strong>AXTOR SPACE</strong> é a organização responsável por esta
              plataforma, operada por Joanderson Silva (Carapicuíba/SP, Brasil).
              Esta política descreve como coletamos, usamos, armazenamos e
              protegemos seus dados pessoais, em conformidade com a{" "}
              <strong>Lei Geral de Proteção de Dados</strong> (LGPD — Lei nº
              13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              2. Quais dados coletamos
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Dados de cadastro:</strong> nome, e-mail e senha (criptografada).
              </li>
              <li>
                <strong>Dados de cobrança:</strong> nome completo e CPF, coletados
                exclusivamente quando você inicia uma compra. Necessários por
                exigência do Banco Central para emissão de Pix.
              </li>
              <li>
                <strong>Dados de uso:</strong> métricas anônimas de navegação na
                plataforma (cliques em blocos, visitas em bio) para melhorar a
                experiência. Não vendemos esses dados.
              </li>
              <li>
                <strong>Mídia que você sobe:</strong> imagens, vídeos e textos que
                você publica voluntariamente na sua bio ou em diagnósticos.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Não coletamos:</strong> dados sensíveis (origem racial,
              opinião política, religião, saúde, vida sexual), dados de menores
              de 12 anos, dados de cartão de crédito (processamento delegado ao
              gateway de pagamento).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              3. Para que usamos seus dados
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Autenticar seu acesso à plataforma.</li>
              <li>Emitir cobranças e enviar comprovantes de pagamento.</li>
              <li>Cumprir obrigações fiscais e contábeis (CPF + valor pago).</li>
              <li>Personalizar sua experiência no painel.</li>
              <li>
                Enviar notificações operacionais (sobre seu plano, sua bio, suas
                compras). Não enviamos spam.
              </li>
            </ul>
            <p className="mt-3">
              A base legal para esse tratamento é o <strong>consentimento</strong>{" "}
              (Art. 7, I) e a <strong>execução de contrato</strong> (Art. 7, V).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              4. Com quem compartilhamos
            </h2>
            <p className="mt-2">
              Compartilhamos o mínimo necessário e apenas com operadores que
              também são submetidos à LGPD:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Asaas (asaas.com)</strong> — processamento de pagamento
                Pix, cartão e boleto. Recebem nome, CPF e e-mail apenas para
                emitir a cobrança.
              </li>
              <li>
                <strong>Supabase Inc.</strong> — armazenamento dos dados em banco
                de dados protegido. Servidores com segurança ativa, backups
                criptografados e em região da América do Sul (sa-east-1).
              </li>
              <li>
                <strong>Vercel / Lovable</strong> — hospedagem da aplicação web.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Não vendemos seus dados</strong> para terceiros. Não
              compartilhamos com anunciantes. Não usamos dados pessoais para
              treinar modelos de IA.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              5. Por quanto tempo guardamos
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Dados de cadastro:</strong> enquanto sua conta estiver
                ativa.
              </li>
              <li>
                <strong>Dados de cobrança (CPF, valor, data):</strong> 5 anos após
                a transação, conforme exigência fiscal brasileira.
              </li>
              <li>
                <strong>Dados de uso anonimizados:</strong> indefinidamente para
                fins estatísticos.
              </li>
              <li>
                <strong>Mídia que você publicou:</strong> até você deletar ou
                excluir sua conta.
              </li>
            </ul>
            <p className="mt-3">
              Após esses prazos, dados são apagados ou anonimizados em definitivo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              6. Seus direitos
            </h2>
            <p className="mt-2">
              Pela LGPD (Art. 18), você pode a qualquer momento:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Confirmar se tratamos seus dados.</li>
              <li>Acessar uma cópia dos seus dados.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>
                Solicitar anonimização, bloqueio ou eliminação de dados
                desnecessários.
              </li>
              <li>Solicitar a portabilidade dos seus dados a outro serviço.</li>
              <li>
                Revogar o consentimento (sem prejuízo de tratamentos já feitos).
              </li>
              <li>Apresentar reclamação à ANPD (Autoridade Nacional).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              7. Como exercer seus direitos
            </h2>
            <p className="mt-2">
              Envie um e-mail para{" "}
              <a
                href="mailto:axtormail@axtor.space"
                className="text-gold hover:underline"
              >
                axtormail@axtor.space
              </a>{" "}
              com o assunto <strong>"LGPD"</strong> e a solicitação. Vamos
              responder em até <strong>15 dias</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              8. Cookies e rastreamento
            </h2>
            <p className="mt-2">
              Usamos apenas cookies essenciais para manter sua sessão logada. Não
              usamos cookies de publicidade, tracking de terceiros ou pixels de
              rede social.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              9. Segurança
            </h2>
            <p className="mt-2">
              Aplicamos boas práticas técnicas: criptografia em trânsito (HTTPS),
              criptografia em repouso (banco de dados), controle de acesso por
              perfil (RLS), segregação entre dados de tenants distintos, e
              auditoria de modificações sensíveis.
            </p>
            <p className="mt-3">
              Nenhum sistema é 100% seguro. Caso identifiquemos um incidente que
              possa expor seus dados, vamos te notificar em até{" "}
              <strong>72 horas</strong>, conforme exigido pela ANPD.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              10. Encarregado de Dados (DPO)
            </h2>
            <p className="mt-2">
              Encarregado:{" "}
              <strong>Joanderson Silva</strong> — contato:{" "}
              <a
                href="mailto:axtormail@axtor.space"
                className="text-gold hover:underline"
              >
                axtormail@axtor.space
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">
              11. Atualizações
            </h2>
            <p className="mt-2">
              Esta política pode ser atualizada. Quando houver mudança relevante,
              avisaremos por e-mail e/ou no painel. A data da última atualização
              fica sempre no topo desta página.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Privacidade;
