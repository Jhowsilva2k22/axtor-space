/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso — Axtor</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>AXTOR</Text>
        <Heading style={h1}>
          Seu link de <span style={hAccent}>acesso</span>
        </Heading>
        <Text style={text}>
          Clique no botão abaixo para entrar na sua conta Axtor. Este link
          expira em breve por segurança.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Entrar agora
        </Button>
        <Text style={small}>
          Se você não solicitou este link, pode ignorar este email — ninguém
          conseguirá acessar sua conta sem ele.
        </Text>
        <Text style={footer}>axtor.space — sua bio inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
