import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Lock, User, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Authenticate with admin API endpoint
      const response = await fetch(`${API_URL}/auth/admin/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store admin authentication
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      toast({
        title: "Login successful!",
        description: `Welcome back, ${data.user.full_name || data.user.username}!`,
      });
      
      onLoginSuccess();
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#111111] border border-[#222222] shadow-2xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C6A86B] flex items-center justify-center"
            >
              <Lock className="w-8 h-8 text-[#0B0B0C]" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-[#F5F1E8]">
              Admin Access
            </CardTitle>
            <p className="text-[#9CA3AF] text-sm">
              Enter your credentials to access the dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#F5F1E8]/80">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-[#1A1A1A] border-[#222222] text-[#F5F1E8] placeholder:text-[#9CA3AF] focus:border-[#C6A86B]"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#F5F1E8]/80">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#1A1A1A] border-[#222222] text-[#F5F1E8] placeholder:text-[#9CA3AF] focus:border-[#C6A86B]"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] hover:text-[#F5F1E8]/60"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C6A86B] hover:bg-[#D4B87A] text-[#0B0B0C] font-medium py-2.5"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#0B0B0C]/30 border-t-[#0B0B0C] rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-[#9CA3AF]">
                Use the admin credentials to access the dashboard
              </p>
              <p className="text-xs text-white/30 mt-1">
                {/* Username: Art1204 | Password: Art@1204 */}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
