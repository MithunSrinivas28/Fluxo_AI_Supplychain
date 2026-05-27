import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import fluxoLogo from "@/assets/fluxo-logo.png";
import { registerUser } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    icon: "🛡️",
    desc: "Full platform control & global visibility"
  },
  {
    value: "retailer",
    label: "Retailer",
    icon: "🏪",
    desc: "Create requests, view forecasts & analytics"
  },
  {
    value: "warehouse",
    label: "Warehouse Manager",
    icon: "🏭",
    desc: "Manage inventory, monitor stock & reorders"
  }
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("retailer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Valid email is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const data = await registerUser(name, email, password, role);
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;
      if (token && user) {
        login(
          { id: user.id || user._id, name: user.name, email: user.email, role: user.role },
          token
        );
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <Card className="shadow-card">
          <CardHeader className="text-center space-y-2">
            <img src={fluxoLogo} alt="FluxoAI" className="h-12 mx-auto object-contain" />
            <CardDescription>Create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Select your role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                        role === r.value
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-2xl">{r.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{r.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </Button>
              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
