"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAppContext } from "@/context/AppContext";

export default function RegisterPage() {
  const router = useRouter();
  const { setToken } = useAppContext();
  
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  
  // Validation state for shake animations
  const [nameError, setNameError] = React.useState(false);
  const [emailError, setEmailError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    
    if (!name) {
      setNameError(true);
      hasError = true;
      setTimeout(() => setNameError(false), 500);
    }

    if (!email) {
      setEmailError(true);
      hasError = true;
      setTimeout(() => setEmailError(false), 500);
    }
    
    if (!password) {
      setPasswordError(true);
      hasError = true;
      setTimeout(() => setPasswordError(false), 500);
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await api.post('auth/register/', { 
        first_name: name, 
        email, 
        password,
        password_confirm: password
      });
      // Auto login after registration
      const loginRes = await api.post('auth/login/', { email, password });
      setToken(loginRes.data.access);
      
      setIsSubmitting(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        router.push("/studio/upload");
      }, 1500);
    } catch (err) {
      setIsSubmitting(false);
      setNameError(true);
      setEmailError(true);
      setPasswordError(true);
      setTimeout(() => {
        setNameError(false);
        setEmailError(false);
        setPasswordError(false);
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#09090b] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/80 relative overflow-hidden"
    >
      {/* Success Pulse Background */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-success/10 z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
            $ auth register
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Initialize a new developer workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Developer_Name:
            </Label>
            <motion.div
              animate={nameError ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Input
                id="name"
                type="text"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`bg-[#18181b] border-white/10 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 transition-all ${
                  nameError ? "border-error focus:border-error focus:ring-error/20" : ""
                }`}
                disabled={isSubmitting || isSuccess}
              />
            </motion.div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Email_Address:
            </Label>
            <motion.div
              animate={emailError ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Input
                id="email"
                type="email"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`bg-[#18181b] border-white/10 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 transition-all ${
                  emailError ? "border-error focus:border-error focus:ring-error/20" : ""
                }`}
                disabled={isSubmitting || isSuccess}
              />
            </motion.div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Secret_Key:
            </Label>
            <motion.div
              animate={passwordError ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`bg-[#18181b] border-white/10 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 transition-all pr-10 ${
                  passwordError ? "border-error focus:border-error focus:ring-error/20" : ""
                }`}
                disabled={isSubmitting || isSuccess}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting || isSuccess}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </motion.div>
          </div>

          <motion.button
            whileTap={!isSubmitting && !isSuccess ? { scale: 0.98 } : {}}
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`w-full h-12 rounded-md font-mono font-semibold flex items-center justify-center transition-all ${
              isSuccess 
                ? "bg-success text-success-foreground shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                : "bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]"
            } disabled:opacity-80 disabled:cursor-not-allowed`}
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="submitting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Provisioning...
                </motion.div>
              ) : isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Workspace Ready
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  Create Account
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground font-mono">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline hover:text-primary-light transition-colors">
            $ auth login
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
