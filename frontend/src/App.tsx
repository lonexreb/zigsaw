import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NetworkAnalyticsProvider } from "./contexts/NetworkAnalyticsContext";
import { NodeNamingProvider } from "./contexts/NodeNamingContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SubscriptionPage from "./pages/SubscriptionPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
// Marketing surfaces ported from Zigsaw-lab (issue #1)
import PricingPage from "./pages/marketing/PricingPage";
import OnboardingPage from "./pages/marketing/OnboardingPage";
import WaitlistPage from "./pages/marketing/WaitlistPage";
import UseCasesPage from "./pages/marketing/UseCasesPage";
import SupportPage from "./pages/marketing/SupportPage";
import ProductPage from "./pages/marketing/ProductPage";
import LearnPage from "./pages/marketing/LearnPage";
// First-time user onboarding wizard (issue #16)
import OnboardingWizard from "./pages/OnboardingWizard";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NetworkAnalyticsProvider>
        <NodeNamingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route
                  path="/workflow"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/cancel" element={<CancelPage />} />
                {/* Marketing routes (issue #1) */}
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/waitlist" element={<WaitlistPage />} />
                <Route path="/use-cases" element={<UseCasesPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/welcome" element={<OnboardingWizard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NodeNamingProvider>
      </NetworkAnalyticsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
