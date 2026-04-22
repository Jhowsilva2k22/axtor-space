import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'axtor'

interface PartnerInviteProps {
  name?: string
  inviteUrl?: string
  note?: string
}

const PartnerInviteEmail = ({
  name,
  inviteUrl = 'https://axtor.space/signup',
  note,
}: PartnerInviteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidada como sócia da {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>{SITE_NAME}</Text>
          <Text style={badge}>★ convite de sócia</Text>
        </Section>

        <Heading style={h1}>
          {name ? `${name}, bem-vinda à axtor.` : 'Bem-vinda à axtor.'}
        </Heading>

        <Text style={text}>
          Você acabou de receber um convite especial pra fazer parte da axtor como
          <strong style={gold}> sócia</strong> — acesso completo, vitalício, sem cobrança.
        </Text>

        <Text style={text}>
          Tudo desbloqueado: blocos ilimitados, analytics, campanhas, melhorias com IA,
          temas premium e sua bio sem nenhum selo.
        </Text>

        {note ? (
          <Section style={noteBox}>
            <Text style={noteText}>{note}</Text>
          </Section>
        ) : null}

        <Section style={ctaWrap}>
          <Button style={button} href={inviteUrl}>
            Criar minha conta
          </Button>
        </Section>

        <Text style={smallText}>
          Ou copie e cole este link no navegador:
        </Text>
        <Text style={linkText}>{inviteUrl}</Text>

        <Hr style={hr} />

        <Text style={footer}>
          Esse convite é único e foi gerado especialmente pra você. Se não esperava
          recebê-lo, pode ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PartnerInviteEmail,
  subject: (data: Record<string, any>) =>
    data?.name ? `${data.name}, seu convite de sócia da axtor chegou` : 'Seu convite de sócia da axtor chegou',
  displayName: 'Convite de sócia (partner)',
  previewData: {
    name: 'Stefany',
    inviteUrl: 'https://axtor.space/signup?invite=ABC123&email=stefany@example.com',
    note: 'stefany mello — sócia',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
  margin: 0,
  padding: '40px 0',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
  backgroundColor: '#0d0d0d',
  borderRadius: '12px',
  border: '1px solid rgba(201, 168, 76, 0.18)',
}
const header = { marginBottom: '32px', textAlign: 'center' as const }
const brand = {
  fontFamily: "'Cormorant Garamond', Didot, serif",
  fontSize: '32px',
  letterSpacing: '0.12em',
  color: '#c9a84c',
  margin: 0,
  fontWeight: 400,
}
const badge = {
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#c9a84c',
  marginTop: '8px',
  opacity: 0.8,
}
const h1 = {
  fontFamily: "'Cormorant Garamond', Didot, serif",
  fontSize: '28px',
  fontWeight: 400,
  color: '#f5e9c8',
  margin: '0 0 24px',
  lineHeight: 1.25,
}
const text = {
  fontSize: '15px',
  color: '#d8d3c5',
  lineHeight: 1.65,
  margin: '0 0 18px',
  fontWeight: 300,
}
const gold = { color: '#c9a84c', fontWeight: 500 }
const noteBox = {
  backgroundColor: 'rgba(201, 168, 76, 0.08)',
  border: '1px solid rgba(201, 168, 76, 0.2)',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '8px 0 24px',
}
const noteText = {
  fontSize: '13px',
  color: '#c9a84c',
  margin: 0,
  fontStyle: 'italic' as const,
}
const ctaWrap = { textAlign: 'center' as const, margin: '32px 0 24px' }
const button = {
  backgroundColor: '#c9a84c',
  color: '#0d0d0d',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.02em',
}
const smallText = {
  fontSize: '12px',
  color: '#888',
  margin: '20px 0 4px',
  textAlign: 'center' as const,
}
const linkText = {
  fontSize: '12px',
  color: '#c9a84c',
  margin: 0,
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
}
const hr = {
  borderColor: 'rgba(201, 168, 76, 0.15)',
  margin: '32px 0 20px',
}
const footer = {
  fontSize: '11px',
  color: '#777',
  lineHeight: 1.6,
  margin: 0,
  textAlign: 'center' as const,
}