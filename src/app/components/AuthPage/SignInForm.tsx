import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Mail, Lock, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { SignInFormData } from "./types";

interface SignInFormProps {
  onSignInSuccess: (role: string) => void;
  onSwitchToSignUp: () => void;
}

export function SignInForm({ onSignInSuccess, onSwitchToSignUp }: SignInFormProps) {
  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please enter email and password");
      return;
    }

    // TODO: Replace with actual API call
    // POST /api/auth/signin
    toast.success("Sign in successful!");

    // Default to Faculty role for demo
    onSignInSuccess("Faculty");
  };

  return (
    <Card className="shadow-2xl border-0">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4 md:hidden">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your.email@college.edu"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="link" className="text-sm p-0 h-auto">
              Forgot password?
            </Button>
          </div>

          <Button type="submit" className="w-full">
            Sign In
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto"
              onClick={onSwitchToSignUp}
            >
              Sign up here
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
