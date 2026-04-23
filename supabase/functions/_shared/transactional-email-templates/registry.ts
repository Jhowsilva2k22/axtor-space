/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as partnerInvite } from './partner-invite.tsx'
import { template as testerInvite } from './tester-invite.tsx'
import { template as welcomeTenant } from './welcome-tenant.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'partner-invite': partnerInvite,
  'tester-invite': testerInvite,
  'welcome-tenant': welcomeTenant,
}