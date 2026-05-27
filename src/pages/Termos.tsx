import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Termos = () => {
  const lastUpdate = "27 de maio de 2026";

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
          <h1 className="font-display text-4xl">Termos de Uso</h1>
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Última atualização: {lastUpdate}
          </p>
        </header>

        <article className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl text-primary">1. Aceitação</h2>
            <p className="mt-2">
              Ao criar uma conta ou utilizar qualquer recurso da{" "}
              <strong>AXTOR SPACE</strong>, você declara ter lido, entendido e
              concordado com estes Termos de Uso. Se não concordar com algum
              ponto, não utilize a plataforma.
            </p>
            <p className="mt-3">
              Estes termos regem o relacionamento entre você (Usuário) e a{" "}
              <strong>AXTOR SPACE</strong>, operada por Joanderson Silva
              (Carapicuíba/SP, Brasil). Para dúvidas:{" "}
              <a href="mailto:axtormail@axtor.space" className="text-gold hover:underline">
                axtormail@axtor.space
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">2. O que é a plataforma</h2>
            <p className="mt-2">
              AXTOR SPACE é uma plataforma SaaS voltada para criadores de
              conteúdo e profissionais que desejam construir sua presença
              digital. Os recursos incluem:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Bio-link personalizável com domínio próprio.</li>
              <li>Diagnóstico de perfil do Instagram com análise por inteligência artificial.</li>
              <li>Geração de funil de vendas e conteúdo estratégico.</li>
              <li>Ferramentas de captura de leads e automação de comunicação.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">3. Elegibilidade</h2>
            <p className="mt-2">
              Para criar uma conta você deve:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Ter no mínimo 18 anos (ou ter consentimento dos responsáveis).</li>
              <li>Fornecer informações verdadeiras no cadastro.</li>
              <li>Ser o titular ou representante legal do perfil que será analisado.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">4. Sua conta</h2>
            <p className="mt-2">
              Você é responsável por manter a confidencialidade da sua senha e
              por todas as atividades realizadas na sua conta. Notifique-nos
              imediatamente em caso de uso não autorizado em{" "}
              <a href="mailto:axtormail@axtor.space" className="text-gold hover:underline">
                axtormail@axtor.space
              </a>
              .
            </p>
            <p className="mt-3">
              Cada conta pertence a um único titular. É vedada a revenda,
              compartilhamento ou cessão de acesso a terceiros sem autorização
              prévia e expressa da AXTOR SPACE.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">5. Planos e pagamentos</h2>
            <p className="mt-2">
              A plataforma oferece planos gratuitos e pagos. Para os planos
              pagos:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                A cobrança é processada via <strong>Asaas</strong> (Pix, cartão
                ou boleto). Ao finalizar uma compra, você concorda também com os
                termos do gateway de pagamento.
              </li>
              <li>
                Planos mensais são renovados automaticamente. Você pode cancelar
                a qualquer momento pelo painel antes da data de renovação.
              </li>
              <li>
                Não há reembolso proporcional por dias não utilizados após a
                renovação, salvo decisão judicial ou determinação do PROCON.
              </li>
              <li>
                Preços podem ser alterados com aviso prévio de 30 dias por
                e-mail.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">6. Uso permitido</h2>
            <p className="mt-2">Você pode usar a plataforma para:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Promover sua marca pessoal, serviços ou produtos lícitos.</li>
              <li>Analisar seu próprio perfil do Instagram.</li>
              <li>Criar e compartilhar conteúdo autoral.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">7. Uso proibido</h2>
            <p className="mt-2">É expressamente vedado:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                Publicar conteúdo ilegal, difamatório, violento, pornográfico
                ou que viole direitos de terceiros.
              </li>
              <li>
                Usar a plataforma para spam, phishing, fraude ou qualquer
                atividade criminosa.
              </li>
              <li>
                Realizar engenharia reversa, scraping automatizado ou ataques
                à infraestrutura da plataforma.
              </li>
              <li>
                Analisar perfis de terceiros sem autorização do titular.
              </li>
              <li>
                Usar automações que excedam os limites de uso publicados
                (rate limits).
              </li>
            </ul>
            <p className="mt-3">
              Violações podem resultar em suspensão imediata da conta, sem
              direito a reembolso.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">8. Conteúdo do usuário</h2>
            <p className="mt-2">
              Todo conteúdo que você publica (textos, imagens, links) continua
              sendo de sua propriedade. Ao publicá-lo, você nos concede uma
              licença não exclusiva, gratuita e mundial para exibi-lo na
              plataforma enquanto sua conta estiver ativa.
            </p>
            <p className="mt-3">
              Você declara ter os direitos necessários sobre o conteúdo
              publicado e que ele não viola direitos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">9. Dados do Instagram</h2>
            <p className="mt-2">
              O diagnóstico de perfil coleta dados públicos do Instagram
              (nome, bio, número de seguidores, posts recentes) via API de
              terceiros. Ao solicitar uma análise, você declara:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Que o perfil analisado é seu ou que você tem autorização do titular.</li>
              <li>
                Que compreende que o resultado é gerado por inteligência
                artificial e tem caráter orientativo, não garantindo resultados
                específicos de negócio.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">10. Disponibilidade</h2>
            <p className="mt-2">
              Nos esforçamos para manter a plataforma disponível 24/7, mas não
              garantimos disponibilidade ininterrupta. Manutenções programadas
              serão avisadas com antecedência sempre que possível. Não somos
              responsáveis por perdas decorrentes de indisponibilidade temporária.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">11. Limitação de responsabilidade</h2>
            <p className="mt-2">
              A AXTOR SPACE não se responsabiliza por:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Resultados de negócio decorrentes do uso da plataforma.</li>
              <li>Conteúdo publicado por outros usuários.</li>
              <li>Falhas de serviços de terceiros (Instagram, Asaas, Supabase, Vercel).</li>
              <li>Danos indiretos, lucros cessantes ou perda de dados por força maior.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">12. Encerramento de conta</h2>
            <p className="mt-2">
              Você pode solicitar o encerramento da sua conta a qualquer
              momento pelo painel ou por e-mail para{" "}
              <a href="mailto:axtormail@axtor.space" className="text-gold hover:underline">
                axtormail@axtor.space
              </a>
              . Após a exclusão, seus dados pessoais serão removidos conforme
              descrito na{" "}
              <Link to="/privacidade" className="text-gold hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <p className="mt-3">
              Podemos suspender ou encerrar contas que violem estes termos, com
              ou sem aviso prévio, dependendo da gravidade da infração.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">13. Alterações nos termos</h2>
            <p className="mt-2">
              Podemos atualizar estes termos a qualquer momento. Mudanças
              relevantes serão comunicadas por e-mail com ao menos 15 dias de
              antecedência. O uso continuado da plataforma após esse prazo
              implica aceitação das alterações.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">14. Lei aplicável e foro</h2>
            <p className="mt-2">
              Estes termos são regidos pelas leis da República Federativa do
              Brasil. Em caso de conflito, fica eleito o foro da comarca de
              Carapicuíba/SP, com renúncia a qualquer outro, por mais
              privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-primary">15. Contato</h2>
            <p className="mt-2">
              Para dúvidas, reclamações ou sugestões relacionadas a estes
              termos, entre em contato:{" "}
              <a href="mailto:axtormail@axtor.space" className="text-gold hover:underline">
                axtormail@axtor.space
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Termos;
