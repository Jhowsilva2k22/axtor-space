/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação — Axtor</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://bdxkcfngskagriaapepo.supabase.co/storage/v1/object/public/email-assets/axtor-logo.png" alt="Axtor Labs" width="120" height="40" style={{ display: "block", margin: "0 0 24px", height: "auto" }} />
        <Heading style={h1}>
          Confirme sua <span style={hAccent}>identidade</span>
        </Heading>
        <Text style={text}>
          Use o código abaixo para confirmar uma ação sensível na sua conta:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={small}>
          Este código expira em breve. Se você não solicitou esta verificação,
          pode ignorar este email com tranquilidade.
        </Text>
        <Text style={footer}>axtor.space — sua bio inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '32px',
  letterSpacing: '0.4em',
  fontWeight: 600 as const,
  color: '#0d0d0d',
  margin: '0 0 32px',
  padding: '20px',
  textAlign: 'center' as const,
  border: '1px solid #e5d9b8',
  borderRadius: '2px',
  backgroundColor: '#faf6e8',
}
const small = {
  fontSize: '13px',
  color: '#777',
  lineHeight: '1.6',
  margin: '0 0 0',
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
