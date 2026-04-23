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

interface WelcomeTenantProps {
  name?: string
  bioUrl?: string
  adminUrl?: string
  slug?: string
  plan?: 'free' | 'partner' | 'tester' | string
}

const PLAN_BADGES: Record<string, { label: string; tag: string }> = {
  free: { label: 'plano free', tag: '✦ bem-vindo' },
  partner: { label: 'acesso parceiro', tag: '★ vitalício' },
  tester: { label: 'acesso beta-tester', tag: '✦ tudo liberado' },
}

const WelcomeTenantEmail = ({
  name,
  bioUrl = 'https://axtor.space',
  adminUrl = 'https://axtor.space/admin',
  slug = 'sua-bio',
  plan = 'free',
}: WelcomeTenantProps) => {
  const badgeInfo = PLAN_BADGES[plan] ?? PLAN_BADGES.free
  const firstName = name?.split(' ')[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Sua bio na axtor está no ar — {bioUrl.replace('https://', '')}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src="https://bdxkcfngskagriaapepo.supabase.co/storage/v1/object/public/email-assets/axtor-logo.png" alt="Axtor Labs" width="120" height="40" style={{ display: "block", margin: "0 0 24px", height: "auto" }} />
            <Text style={badge}>{badgeInfo.tag}</Text>
          </Section>

          <Heading style={h1}>
            {firstName ? `${firstName}, sua bio está no ar.` : 'Sua bio está no ar.'}
          </Heading>

          <Text style={text}>
            Bem-vindo à axtor. Sua página acabou de nascer — limpa, rápida, sua.
            De agora em diante, um link só: tudo o que importa em um lugar só.
          </Text>

          {/* Card do link da bio — destaque principal */}
          <Section style={linkCard}>
            <Text style={linkLabel}>seu link</Text>
            <Text style={linkUrl}>{bioUrl.replace('https://', '')}</Text>
            <Text style={linkSub}>
              <span style={planTag}>{badgeInfo.label}</span>
            </Text>
          </Section>

          {/* CTA principal */}
          <Section style={ctaWrap}>
            <Button style={button} href={adminUrl}>
              Personalizar minha bio
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={sectionTitle}>próximos passos</Text>

          <Section style={stepRow}>
            <Row>
              <Column style={stepNumCol}><Text style={stepNum}>1</Text></Column>
              <Column>
                <Text style={stepTitle}>Coloque sua cara</Text>
                <Text style={stepDesc}>Avatar, headline e capa de fundo. Em 2 minutos sua bio vira sua identidade.</Text>
              </Column>
            </Row>
          </Section>

          <Section style={stepRow}>
            <Row>
              <Column style={stepNumCol}><Text style={stepNum}>2</Text></Column>
              <Column>
                <Text style={stepTitle}>Adicione seus links</Text>
                <Text style={stepDesc}>Instagram, WhatsApp, YouTube, site, contato. Cada bloco com ícone e descrição.</Text>
              </Column>
            </Row>
          </Section>

          <Section style={stepRow}>
            <Row>
              <Column style={stepNumCol}><Text style={stepNum}>3</Text></Column>
              <Column>
                <Text style={stepTitle}>Compartilhe</Text>
                <Text style={stepDesc}>Cole o link no Instagram, gere o QR code e veja os cliques chegarem em tempo real.</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section style={previewWrap}>
            <Text style={mockupLabel}>preview da sua bio</Text>
            <div style={mockupCard}>
              <div style={mockupAvatar}>{(firstName || 'A').charAt(0).toUpperCase()}</div>
              <Text style={mockupName}>{name || 'sua marca'}</Text>
              <Text style={mockupHeadline}>headline aqui — algo que define você</Text>
              <div style={mockupBlock}>★ link principal</div>
              <div style={mockupBlock}>✦ instagram</div>
              <div style={mockupBlockGhost}>+ adicionar mais</div>
            </div>
          </Section>

          <Section style={ctaSecondaryWrap}>
            <Button style={buttonSecondary} href={bioUrl}>
              Ver minha bio
            </Button>
          </Section>

          <Text style={smallText}>Ou copie o link no navegador:</Text>
          <Text style={linkText}>{bioUrl}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            Você está recebendo este email porque criou uma conta na axtor com o slug <strong style={gold}>/{slug}</strong>.
            Dúvidas? Responda este email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeTenantEmail,
  subject: (data: Record<string, any>) =>
    data?.name
      ? `${String(data.name).split(' ')[0]}, sua bio na axtor está no ar`
      : 'Sua bio na axtor está no ar',
  displayName: 'Boas-vindas (nova bio)',
  previewData: {
    name: 'Joanderson Silva',
    bioUrl: 'https://axtor.space/joanderson',
    adminUrl: 'https://axtor.space/admin',
    slug: 'joanderson',
    plan: 'free',
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
  margin: '0 0 20px',
  lineHeight: 1.25,
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#d8d3c5',
  lineHeight: 1.65,
  margin: '0 0 24px',
  fontWeight: 300,
  textAlign: 'center' as const,
}
const gold = { color: '#c9a84c', fontWeight: 500 }

const linkCard = {
  backgroundColor: 'rgba(201, 168, 76, 0.08)',
  border: '1px solid rgba(201, 168, 76, 0.35)',
  borderRadius: '10px',
  padding: '20px 18px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}
const linkLabel = {
  fontSize: '10px', color: '#c0c0c0', textTransform: 'uppercase' as const,
  letterSpacing: '0.22em', margin: '0 0 8px',
}
const linkUrl = {
  fontFamily: "'Cormorant Garamond', Didot, serif",
  fontSize: '20px', color: '#f5e9c8', margin: '0 0 8px',
  letterSpacing: '0.02em',
}
const linkSub = { margin: 0 }
const planTag = {
  display: 'inline-block',
  fontSize: '10px', color: '#c9a84c',
  textTransform: 'uppercase' as const, letterSpacing: '0.18em',
  border: '1px solid rgba(201, 168, 76, 0.4)',
  padding: '3px 10px', borderRadius: '999px',
}

const ctaWrap = { textAlign: 'center' as const, margin: '8px 0 24px' }
const ctaSecondaryWrap = { textAlign: 'center' as const, margin: '8px 0 16px' }
const button = {
  backgroundColor: '#c9a84c',
  color: '#0d0d0d',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
}
const buttonSecondary = {
  backgroundColor: 'transparent',
  color: '#c9a84c',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 500,
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  border: '1px solid rgba(201, 168, 76, 0.45)',
}

const sectionTitle = {
  fontSize: '11px',
  color: '#c0c0c0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.22em',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const stepRow = { margin: '0 0 14px' }
const stepNumCol = { width: '36px', verticalAlign: 'top' as const }
const stepNum = {
  width: '28px', height: '28px', lineHeight: '28px',
  borderRadius: '50%',
  backgroundColor: 'rgba(201, 168, 76, 0.15)',
  border: '1px solid rgba(201, 168, 76, 0.45)',
  color: '#c9a84c',
  fontFamily: "'Cormorant Garamond', Didot, serif",
  fontSize: '14px', textAlign: 'center' as const,
  margin: 0,
}
const stepTitle = {
  fontSize: '14px', color: '#f5e9c8',
  margin: '2px 0 4px', fontWeight: 500,
}
const stepDesc = {
  fontSize: '13px', color: '#a8a39a',
  lineHeight: 1.55, margin: 0, fontWeight: 300,
}

const previewWrap = { textAlign: 'center' as const, margin: '8px 0 20px' }
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
  margin: '28px 0 24px',
}
const footer = {
  fontSize: '11px',
  color: '#777',
  lineHeight: 1.6,
  margin: 0,
  textAlign: 'center' as const,
}
