import { Navigate, useSearchParams } from "react-router-dom";
import { useDeepDiagnostic } from "@/hooks/useDeepDiagnostic";
import { DeepDiagnosticReviewView } from "@/pages/DeepDiagnosticReviewView";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DeepDiagnosticEditor() {
  const { hasAddon, loading } = useDeepDiagnostic();
  const [searchParams] = useSearchParams();
  const funnelId = searchParams.get("funnelId");

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </Card>
    );
  }

  if (hasAddon === false) {
    return <Navigate to="/admin/deep-diagnostic/demo" replace />;
  }

  if (!funnelId) {
    return <Navigate to="/painel?tab=imersivo" replace />;
  }

  return <DeepDiagnosticReviewView funnelId={funnelId} />;
}
