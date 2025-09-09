import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const { toast } = useToast();

  // Password strength validation
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }
    
    return { valid: true, message: "Password is strong" };
  };

  // Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Supabase's password reset functionality to send the email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });

      // Move to OTP verification step
      setStep("otp");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, you would verify the OTP with your backend
      // For this example, we'll simulate verification and move to the reset step
      
      // Simulate OTP verification
      if (otp.length < 6) {
        throw new Error("Invalid verification code. Please check and try again.");
      }

      toast({
        title: "Verification Successful",
        description: "You can now reset your password.",
      });

      // Move to password reset step
      setStep("reset");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password strength
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // In a real implementation, you would update the password with your backend
      // For this example, we'll simulate a successful password reset
      
      // Simulate password update with Supabase
      // Note: In a real implementation, you would use the OTP to verify and update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });

      // Return to login
      onBack();
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-border/50 shadow-card">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {step === "email" && "Forgot Password"}
          {step === "otp" && "Verify Email"}
          {step === "reset" && "Reset Password"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {step === "email" && "Enter your email to receive a verification code"}
          {step === "otp" && "Enter the verification code sent to your email"}
          {step === "reset" && "Create a new strong password for your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Code
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium text-foreground">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="bg-secondary/50 border-border/50 focus:bg-background transition-colors"
              />
              <p className="text-xs text-muted-foreground">
                Please check your email ({email}) for the verification code
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("email")}
              className="w-full mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pl-10 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                />
              </div>
              <div className="text-xs space-y-1">
                <p className={newPassword.length >= 8 ? "text-green-500" : "text-muted-foreground"}>
                  <Check className={`inline h-3 w-3 ${newPassword.length >= 8 ? "text-green-500" : "text-muted-foreground"}`} />
                  At least 8 characters
                </p>
                <p className={/[A-Z]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}>
                  <Check className={`inline h-3 w-3 ${/[A-Z]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}`} />
                  At least one uppercase letter
                </p>
                <p className={/[a-z]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}>
                  <Check className={`inline h-3 w-3 ${/[a-z]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}`} />
                  At least one lowercase letter
                </p>
                <p className={/[0-9]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}>
                  <Check className={`inline h-3 w-3 ${/[0-9]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}`} />
                  At least one number
                </p>
                <p className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}>
                  <Check className={`inline h-3 w-3 ${/[^A-Za-z0-9]/.test(newPassword) ? "text-green-500" : "text-muted-foreground"}`} />
                  At least one special character
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("otp")}
              className="w-full mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}