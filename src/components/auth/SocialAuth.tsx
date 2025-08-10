import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Github, Linkedin, Globe, UserCircle, Loader2 } from "lucide-react";

export default function SocialAuth() {
  const { toast } = useToast();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const providers: Array<{
    id: "google" | "github" | "linkedin_oidc" | "facebook";
    label: string;
    Icon: any;
  }> = [
    { id: "google", label: "Continue with Google", Icon: Globe },
    { id: "github", label: "Continue with GitHub", Icon: Github },
    { id: "linkedin_oidc", label: "Continue with LinkedIn", Icon: Linkedin },
    { id: "facebook", label: "Continue with Facebook", Icon: UserCircle },
  ];

  const handleOAuthLogin = async (
    provider: "google" | "github" | "linkedin_oidc" | "facebook"
  ) => {
    try {
      setLoadingProvider(provider);
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Social login failed",
        description:
          error?.message ||
          "Please ensure this provider is configured in Supabase and try again.",
        variant: "destructive",
      });
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-2">
      {providers.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          className="w-full justify-center"
          disabled={!!loadingProvider}
          onClick={() => handleOAuthLogin(id)}
        >
          {loadingProvider === id ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icon className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      ))}
    </div>
  );
}
