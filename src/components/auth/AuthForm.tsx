import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mail, Lock, User, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  mode: "login" | "signup";
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (must be more than 50KB)
    const fileSizeInKB = file.size / 1024;
    if (fileSizeInKB <= 50) {
      toast({
        title: "File too small",
        description: `File size is ${fileSizeInKB.toFixed(1)}KB. Avatar image must be larger than 50KB. Please choose a higher quality image.`,
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // If the storage bucket doesn't exist, we'll just return null
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          console.warn('Storage bucket not found, skipping avatar upload');
          return null;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // Don't show error toast for storage issues - just log and continue
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        console.log('Starting signup process...');
        
        // Validate required fields for signup
        if (!username.trim()) {
          throw new Error("Username is required");
        }

        if (!avatarFile) {
          throw new Error("Avatar image is required");
        }

        console.log('Validating username:', username.trim());

        // Check if username is already taken (only if profiles table exists)
        let usernameExists = false;
        try {
          const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username.trim())
            .single();

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking username:', checkError);
            // Continue anyway - the table might not exist yet
          }

          if (existingUser) {
            usernameExists = true;
          }
        } catch (error) {
          // If there's an error checking the username, log it but continue
          console.warn('Could not check username uniqueness:', error);
        }

        if (usernameExists) {
          throw new Error("Username is already taken. Please choose a different username.");
        }

        console.log('Creating user account...');
        const redirectUrl = `${window.location.origin}/`;
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: username.trim(),
              full_name: username.trim()
            }
          }
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw signUpError;
        }

        console.log('User created:', user?.id);

        if (user) {
          // Upload avatar
          console.log('Uploading avatar...');
          const avatarUrl = await uploadAvatar(user.id);
          console.log('Avatar URL:', avatarUrl);

          // Create profile (only if profiles table exists)
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: username.trim(),
                avatar_url: avatarUrl,
                full_name: username.trim()
              });

            if (profileError) {
              console.error('Error creating profile:', profileError);
              // Continue anyway as the user account was created
            } else {
              console.log('Profile created successfully');
            }
          } catch (error) {
            console.warn('Could not create profile:', error);
            // Continue anyway as the user account was created
          }
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = error.message || "An unexpected error occurred";
      
      // Provide more user-friendly error messages
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the verification link before signing in.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
          {mode === "login" ? "Welcome back" : "Create account"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {mode === "login" 
            ? "Enter your credentials to sign in" 
            : "Enter your details to create a new account"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={mode === "signup"}
                    className="pl-10 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                  />
                </div>
              </div>

              {/* Avatar Upload Field */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-sm font-medium text-foreground">
                  Avatar Image (min. 50KB)
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} alt="Avatar preview" />
                      ) : (
                        <AvatarFallback className="bg-muted">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeAvatar}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      ref={fileInputRef}
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      required={mode === "signup"}
                      className="bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                    />
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <p>Must be larger than 50KB. Supported formats: JPEG, PNG, GIF</p>
                      {avatarFile && (
                        <p className="text-green-600">
                          ✓ Selected: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)}KB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
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
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <Button
              variant="link"
              onClick={onToggleMode}
              className="ml-1 p-0 h-auto text-primary hover:text-primary/80"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}