import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
        navigate("/");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "¡Registro exitoso!",
          description: "Revisa tu email para confirmar tu cuenta",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://karo-vicous-reservations.vercel.app';
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${currentDomain}/auth/callback`,
      });

      if (error) {
        toast({
          title: "Error al enviar email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña",
      });
      setShowResetForm(false);
      setResetEmail("");
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-rose-900 to-fuchsia-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-md border-rose-500/20 shadow-2xl shadow-rose-500/20">
        <CardHeader className="text-center">
          <div className="mb-4">
            <Logo className="w-16 h-16 mx-auto mb-4" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Karo Vicious69</CardTitle>
          <CardDescription className="text-rose-100/80">
            Accede a nuestra comunidad exclusiva
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showResetForm ? (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/20">
                <TabsTrigger value="signin" className="text-white data-[state=active]:bg-rose-600">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-rose-600">Registrarse</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin" className="text-rose-100">Email</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/20 border-rose-500/30 text-white placeholder:text-rose-200/50 focus:border-rose-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin" className="text-rose-100">Contraseña</Label>
                    <Input
                      id="password-signin"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-black/20 border-rose-500/30 text-white placeholder:text-rose-200/50 focus:border-rose-400"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white shadow-lg shadow-rose-500/25" 
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-rose-300 hover:text-rose-200 text-sm"
                    onClick={() => setShowResetForm(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-rose-100">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/20 border-rose-500/30 text-white placeholder:text-rose-200/50 focus:border-rose-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-rose-100">Contraseña</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-black/20 border-rose-500/30 text-white placeholder:text-rose-200/50 focus:border-rose-400"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white shadow-lg shadow-rose-500/25" 
                    disabled={loading}
                  >
                    {loading ? "Registrando..." : "Registrarse"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Mail className="h-12 w-12 text-rose-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white">Recuperar Contraseña</h3>
                <p className="text-sm text-rose-200/80">
                  Ingresa tu email para recibir un enlace de recuperación
                </p>
              </div>
              
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-rose-100">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="bg-black/20 border-rose-500/30 text-white placeholder:text-rose-200/50 focus:border-rose-400"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white shadow-lg shadow-rose-500/25" 
                  disabled={resetLoading}
                >
                  {resetLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-rose-300 hover:text-rose-200 text-sm"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetEmail("");
                  }}
                >
                  Volver al login
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;