import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { CurrentTenantProvider } from "@/hooks/useCurrentTenant";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ScrollLockGuard } from "@/components/ScrollLockGuard";
import { useGlowEffect } from "./components/landing/GlowCard";

// Eager: rotas mais visitadas (entry points públicos)
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy: tudo o resto carrega sob demanda → bundle inicial muito menor
// Bio e lazy: ela usa a biblioteca inteira de icones (import *), que NAO deve
// pesar nas demais telas (vendas, planos, login). Sob demanda, so na bio.
const Bio = lazy(() => import("./pages/Bio.tsx"));
const SharePage = lazy(() => import("./pages/Share.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics.tsx"));
const AdminBlockMetrics = lazy(() => import("./pages/AdminBlockMetrics.tsx"));
const AdminTemplates = lazy(() => import("./pages/AdminTemplates.tsx"));
const AdminImprovements = lazy(() => import("./pages/AdminImprovements.tsx"));
const AdminInvites = lazy(() => import("./pages/AdminInvites.tsx"));
const AdminLandingPartners = lazy(() => import("./pages/AdminLandingPartners.tsx"));
const RedirectCampaign = lazy(() => import("./pages/RedirectCampaign.tsx"));
const Landing = lazy(() => import("./pages/Landing.tsx"));
const Vendas = lazy(() => import("./pages/Vendas.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const ResetSession = lazy(() => import("./pages/ResetSession.tsx"));
const AdminDiagnostics = lazy(() => import("./pages/AdminDiagnostics.tsx"));
const DeepDiagnosticDemo = lazy(() => import("./pages/DeepDiagnosticDemo.tsx"));
const DeepFunnelPublic = lazy(() => import("./pages/DeepFunnelPublic.tsx"));
const DeepFunnelThankYou = lazy(() => import("./pages/DeepFunnelThankYou.tsx"));
const Painel = lazy(() => import("./pages/Painel.tsx"));
const PainelConfiguracoes = lazy(() => import("./pages/PainelConfiguracoes.tsx"));
const PainelInvites = lazy(() => import("./pages/PainelInvites.tsx"));
const Loja = lazy(() => import("./pages/Loja.tsx"));
const BemVindo = lazy(() => import("./pages/BemVindo.tsx"));
const Privacidade = lazy(() => import("./pages/Privacidade.tsx"));
const Termos = lazy(() => import("./pages/Termos.tsx"));
const AdminHub = lazy(() => import("./pages/AdminHub.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const PathNormalizer = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const lower = pathname.toLowerCase();
    if (lower !== pathname) navigate(lower + search + hash, { replace: true });
  }, [pathname, search, hash, navigate]);
  return null;
};

// Liga o efeito de brilho (borda seguindo o mouse) pra qualquer elemento com
// `data-glow` no app inteiro — uma vez só, e só em quem tem mouse.
const GlowInit = () => {
  useGlowEffect();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PathNormalizer />
        <GlowInit />
        <AuthProvider>
          <TenantProvider>
            <CurrentTenantProvider>
              <AppErrorBoundary>
                <ThemeProvider>
                  <ScrollLockGuard />
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
            <Route path="/" element={<Vendas />} />
            <Route path="/planos" element={<Landing />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/diagnostico" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/d/:id" element={<SharePage />} />
            <Route path="/bio" element={<Bio />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/blocks/:id" element={<AdminBlockMetrics />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/improvements" element={<AdminImprovements />} />
            <Route path="/admin/invites" element={<AdminInvites />} />
            <Route path="/admin/landing-partners" element={<AdminLandingPartners />} />
            <Route path="/admin/diagnostics" element={<AdminDiagnostics />} />
            <Route path="/admin/deep-diagnostic/demo" element={<DeepDiagnosticDemo />} />
            <Route path="/admin/hub" element={<AdminHub />} />
            <Route path="/painel" element={<Painel />} />
            <Route path="/painel/configuracoes" element={<PainelConfiguracoes />} />
            <Route path="/painel/secao/:section" element={<Painel />} />
            <Route path="/painel/convites" element={<PainelInvites />} />
            <Route path="/painel/loja" element={<Loja />} />
            <Route path="/loja" element={<Loja />} />
            <Route path="/bem-vindo" element={<BemVindo />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/privacy" element={<Privacidade />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/terms" element={<Termos />} />
            <Route path="/d/funnel/:slug" element={<DeepFunnelPublic />} />
            <Route path="/obrigado/:slug" element={<DeepFunnelThankYou />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/reset" element={<ResetSession />} />
            <Route path="/r/:slug" element={<RedirectCampaign />} />
            {/* Path-based público: axtor.space/:slug → bio do tenant */}
            <Route path="/:slug" element={<Bio />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ThemeProvider>
              </AppErrorBoundary>
            </CurrentTenantProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
