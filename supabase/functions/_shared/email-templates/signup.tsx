/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirme seu email — bem-vindo à Axtor</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://bdxkcfngskagriaapepo.supabase.co/storage/v1/object/public/email-assets/axtor-logo.png" alt="Axtor Labs" width="120" height="40" style={{ display: "block", margin: "0 0 24px", height: "auto" }} />
        <Heading style={h1}>
          Bem-vindo à <span style={hAccent}>Axtor</span>
        </Heading>
        <Text style={text}>
          Falta só um passo pra liberar sua bio. Confirme o email{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>{' '}
          clicando no botão abaixo.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar email
        </Button>
        <Text style={small}>
          Se você não criou uma conta na Axtor, pode ignorar este email.
        </Text>
        <Text style={footer}>axtor.space — sua bio inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  padding: '40px 0',
}
const container = {
  padding: '40px 32px',
  maxWidth: '520px',
  margin: '0 auto',
  border: '1px solid #e5d9b8',
  borderRadius: '4px',
}
const brand = {
  fontSize: '11px',
  letterSpacing: '0.4em',
  color: '#c9a84c',
  fontWeight: 600 as const,
  margin: '0 0 24px',
  textTransform: 'uppercase' as const,
}
const h1 = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '34px',
  fontWeight: 400 as const,
  color: '#0d0d0d',
  margin: '0 0 24px',
  lineHeight: '1.15',
}
const hAccent = { color: '#c9a84c', fontStyle: 'italic' as const }
const text = {
  fontSize: '15px',
  color: '#3d3d3d',
  lineHeight: '1.65',
  margin: '0 0 28px',
  fontWeight: 300 as const,
}
const link = { color: '#c9a84c', textDecoration: 'underline' }
const button = {
  backgroundColor: '#0d0d0d',
  color: '#c9a84c',
  fontSize: '11px',
  letterSpacing: '0.2em',
  fontWeight: 600 as const,
  borderRadius: '2px',
  padding: '14px 28px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  border: '1px solid #c9a84c',
  display: 'inline-block',
}
const small = {
  fontSize: '13px',
  color: '#777',
  lineHeight: '1.6',
  margin: '32px 0 0',
  fontWeight: 300 as const,
}
const footer = {
  fontSize: '10px',
  color: '#aaa',
  letterSpacing: '0.25em',
  margin: '40px 0 0',
  textTransform: 'uppercase' as const,
  borderTop: '1px solid #f0e8d4',
  paddingTop: '20px',
}
