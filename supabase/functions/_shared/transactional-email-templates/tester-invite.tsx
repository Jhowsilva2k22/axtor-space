import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'axtor'

interface TesterInviteProps {
  name?: string
  inviteUrl?: string
  note?: string
  inviterName?: string
  inviterSlug?: string
  inviterAvatarUrl?: string
  inviterHeadline?: string
}

const TesterInviteEmail = ({
  name,
  inviteUrl = 'https://axtor.space/signup',
  note,
  inviterName,
  inviterSlug,
  inviterAvatarUrl,
  inviterHeadline,
}: TesterInviteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidada como beta-tester da {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://bdxkcfngskagriaapepo.supabase.co/storage/v1/object/public/email-assets/axtor-logo.png" alt="Axtor Labs" width="120" height="40" style={{ display: "block", margin: "0 0 24px", height: "auto" }} />
          <Text style={badge}>✦ convite beta-tester</Text>
        </Section>

        <Heading style={h1}>
          {name ? `${name}, você foi escolhida.` : 'Você foi escolhida.'}
        </Heading>

        {inviterName ? (
          <Section style={inviterCard}>
            <Row>
              <Column style={{ width: '48px', verticalAlign: 'middle' }}>
                {inviterAvatarUrl ? (
                  <img src={inviterAvatarUrl} alt={inviterName} width="40" height="40" style={inviterAvatar} />
                ) : (
                  <div style={inviterAvatarFallback}>{inviterName.charAt(0).toUpperCase()}</div>
                )}
              </Column>
              <Column style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
                <Text style={inviterLabel}>convidada por</Text>
                <Text style={inviterNameStyle}>
                  {inviterName}
                  {inviterSlug ? <span style={inviterHandle}> · axtor.space/{inviterSlug}</span> : null}
                </Text>
              </Column>
            </Row>
          </Section>
        ) : null}

        <Text style={text}>
          Convite especial pra testar a axtor antes de todo mundo — acesso completo
          liberado como <strong style={gold}>beta-tester</strong>, sem cobrança.
        </Text>

        <Text style={text}>
          Tudo desbloqueado: blocos ilimitados, analytics, campanhas, melhorias com IA
          e temas premium. Sua opinião vai moldar o que a axtor vira.
        </Text>

        {note ? (
          <Section style={noteBox}>
            <Text style={noteText}>{note}</Text>
          </Section>
        ) : null}

        <Section style={mockupWrap}>
          <Text style={mockupLabel}>assim sua bio vai ficar</Text>
          <div style={mockupCard}>
            <div style={mockupAvatar}>{(name || 'A').charAt(0).toUpperCase()}</div>
            <Text style={mockupName}>{name || 'sua marca'}</Text>
            <Text style={mockupHeadline}>{inviterHeadline || 'sua headline aqui — algo que define você'}</Text>
            <div style={mockupBlock}>★ link principal</div>
            <div style={mockupBlock}>✦ instagram</div>
            <div style={mockupBlockGhost}>+ adicionar mais</div>
          </div>
        </Section>

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
  component: TesterInviteEmail,
  subject: (data: Record<string, any>) =>
    data?.name ? `${data.name}, seu acesso beta da axtor está liberado` : 'Seu acesso beta da axtor está liberado',
  displayName: 'Convite beta-tester',
  previewData: {
    name: 'Maria',
    inviteUrl: 'https://axtor.space/signup?invite=XYZ789&email=maria@example.com',
    note: 'beta-tester onda 1',
    inviterName: 'Joanderson Silva',
    inviterSlug: 'joanderson',
    inviterHeadline: 'Ajudo pais a se reaproximarem dos filhos com presença real.',
    inviterAvatarUrl: 'https://bdxkcfngskagriaapepo.supabase.co/storage/v1/object/public/avatars/bio/avatar-1776840390451.jpg',
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
  border: '1px solid rgba(192, 192, 192, 0.18)',
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
  color: '#c0c0c0',
  marginTop: '8px',
  opacity: 0.85,
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
  backgroundColor: 'rgba(192, 192, 192, 0.06)',
  border: '1px solid rgba(192, 192, 192, 0.18)',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '8px 0 24px',
}
const noteText = {
  fontSize: '13px',
  color: '#c0c0c0',
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
const inviterCard = {
  backgroundColor: 'rgba(192, 192, 192, 0.05)',
  border: '1px solid rgba(192, 192, 192, 0.18)',
  borderRadius: '10px',
  padding: '12px 14px',
  margin: '0 0 24px',
}
const inviterAvatar = { borderRadius: '50%', border: '1px solid rgba(192, 192, 192, 0.4)', display: 'block' }
const inviterAvatarFallback = {
  width: '40px', height: '40px', borderRadius: '50%',
  border: '1px solid rgba(192, 192, 192, 0.4)',
  backgroundColor: '#1a1a1a', color: '#c0c0c0',
  fontFamily: "'Cormorant Garamond', Didot, serif",
  fontSize: '20px', lineHeight: '40px', textAlign: 'center' as const,
}
const inviterLabel = {
  fontSize: '10px', color: '#888', textTransform: 'uppercase' as const,
  letterSpacing: '0.16em', margin: 0,
}
const inviterNameStyle = { fontSize: '13px', color: '#f5e9c8', margin: '2px 0 0', fontWeight: 500 }
const inviterHandle = { color: '#c9a84c', fontWeight: 400, fontSize: '12px' }
const mockupWrap = { textAlign: 'center' as const, margin: '8px 0 28px' }
const mockupLabel = {
  fontSize: '10px', color: '#888', textTransform: 'uppercase' as const,
  letterSpacing: '0.2em', margin: '0 0 12px',
}
const mockupCard = {
  backgroundColor: '#0a0a0a',
  border: '1px solid rgba(201, 168, 76, 0.22)',
  borderRadius: '14px', padding: '22px 18px 18px',
  maxWidth: '280px', margin: '0 auto',
}
const mockupAvatar = {
  width: '52px', height: '52px', borderRadius: '50%',
  backgroundColor: '#1a1a1a', border: '1px solid rgba(201, 168, 76, 0.5)',
  color: '#c9a84c', fontFamily: "'Cormorant Garamond', Didot, serif",
  fontSize: '24px', lineHeight: '52px', textAlign: 'center' as const,
  margin: '0 auto 10px',
}
const mockupName = {
  fontFamily: "'Cormorant Garamond', Didot, serif",
  fontSize: '17px', color: '#f5e9c8', margin: '0 0 4px', textAlign: 'center' as const,
}
const mockupHeadline = {
  fontSize: '11px', color: '#999', margin: '0 0 16px', lineHeight: 1.4, textAlign: 'center' as const,
}
const mockupBlock = {
  backgroundColor: 'rgba(201, 168, 76, 0.12)',
  border: '1px solid rgba(201, 168, 76, 0.35)',
  borderRadius: '8px', padding: '9px 12px',
  fontSize: '11px', color: '#c9a84c', margin: '0 0 7px',
  textAlign: 'center' as const, letterSpacing: '0.04em',
}
const mockupBlockGhost = {
  border: '1px dashed rgba(201, 168, 76, 0.25)',
  borderRadius: '8px', padding: '9px 12px',
  fontSize: '10px', color: '#666', margin: '0',
  textAlign: 'center' as const, letterSpacing: '0.04em',
}