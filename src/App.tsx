import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { CurrentTenantProvider } from "@/hooks/useCurrentTenant";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SharePage from "./pages/Share.tsx";
import Bio from "./pages/Bio.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import Admin from "./pages/Admin.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminAnalytics from "./pages/AdminAnalytics.tsx";
import AdminBlockMetrics from "./pages/AdminBlockMetrics.tsx";
import AdminTemplates from "./pages/AdminTemplates.tsx";
import AdminImprovements from "./pages/AdminImprovements.tsx";
import AdminInvites from "./pages/AdminInvites.tsx";
import RedirectCampaign from "./pages/RedirectCampaign.tsx";
import Landing from "./pages/Landing.tsx";
import Signup from "./pages/Signup.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import ResetSession from "./pages/ResetSession.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <CurrentTenantProvider>
              <ThemeProvider>
                <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/planos" element={<Landing />} />
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
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/reset" element={<ResetSession />} />
            <Route path="/r/:slug" element={<RedirectCampaign />} />
            {/* Path-based público: axtor.space/:slug → bio do tenant */}
            <Route path="/:slug" element={<Bio />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
                </Routes>
              </ThemeProvider>
            </CurrentTenantProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
