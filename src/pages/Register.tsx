import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const checkUserExists = async (email: string) => {
    try {
      // Check if user exists in auth.users by attempting to sign in with a dummy password
      // This is a workaround since Supabase doesn't provide a direct way to check user existence
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'dummy-password-check'
      });
      
      // If error is "Invalid login credentials", user exists but password is wrong
      // If error is "Email not confirmed", user exists but hasn't confirmed email
      // If error is something else, we assume user doesn't exist
      if (error) {
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('Email link is invalid or has expired')) {
          return true; // User exists
        }
      }
      
      return false; // User doesn't exist
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      // Validate form data
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      
      if (!formData.email.endsWith("@iiti.ac.in")) {
        toast.error("Please use your IIT Indore email to register.");
        return;
      }

      // Check if user already exists
      const userExists = await checkUserExists(formData.email);
      
      if (userExists) {
        toast.error("An account with this email already exists. Please try logging in instead.", {
          action: {
            label: "Go to Login",
            onClick: () => navigate("/login")
          }
        });
        return;
      }

      // Proceed with registration
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          toast.error("An account with this email already exists. Please try logging in instead.", {
            action: {
              label: "Go to Login",
              onClick: () => navigate("/login")
            }
          });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Registration successful! Please check your email to verify your account.");
        navigate("/login");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/landing" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-primary" size={32} />
            <h1 className="text-2xl font-bold gradient-text">Campus Connect</h1>
          </div>
        </div>

        <Card className="card-gradient animate-card-enter">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Campus Connect</CardTitle>
            <CardDescription>
              Create your account with your IIT Indore email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@iiti.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Only @iiti.ac.in emails are accepted
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Register;