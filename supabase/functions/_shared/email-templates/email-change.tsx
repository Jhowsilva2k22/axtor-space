/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu novo email — Axtor</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>AXTOR</Text>
        <Heading style={h1}>
          Confirme seu <span style={hAccent}>novo email</span>
        </Heading>
        <Text style={text}>
          Você pediu para mudar o email da sua conta Axtor de{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>
          Clique abaixo para confirmar essa alteração:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar novo email
        </Button>
        <Text style={small}>
          Se você não pediu essa mudança, proteja sua conta imediatamente
          alterando sua senha.
        </Text>
        <Text style={footer}>axtor.space — sua bio inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
