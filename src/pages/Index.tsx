import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Info, 
  Mail, 
  MapPin, 
  Phone, 
  QrCode, 
  Shield, 
  UserCheck, 
  Users,
  Heart,
  Sparkles,
  Download,
  Settings,
  LogOut
} from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import Logo from "@/components/ui/Logo";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si estamos en un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Intentar detectar si la aplicación está instalada
      // Esta es una técnica común para Android
      const checkAppInstalled = () => {
        const isInstalled = localStorage.getItem('appInstalled') === 'true' || 
                          document.referrer.includes('android-app://') ||
                          window.matchMedia('(display-mode: standalone)').matches;
        
        setIsAppInstalled(isInstalled);
        
        // Si no está instalado, agregar un listener para detectar cuando se instale
        if (!isInstalled) {
          window.addEventListener('appinstalled', () => {
            localStorage.setItem('appInstalled', 'true');
            setIsAppInstalled(true);
          });
        }
      };
      
      checkAppInstalled();
    } else {
      setIsAppInstalled(false);
    }
  }, []);

  useEffect(() => {
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }
  };

  const handleCloseWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcomeModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const WelcomeModal = () => (
    <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border-rose-500/30 text-rose-100">
          <DialogHeader className="text-center">
            <div className="flex flex-col items-center justify-center mb-6">
              <Logo size="lg" className="mb-4" />
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-rose-400 mr-2 animate-pulse" />
                <DialogTitle className="text-2xl sm:text-3xl bg-gradient-to-r from-rose-400 via-red-400 to-rose-300 bg-clip-text text-transparent">
                  ¡Bienvenido a KaroVicious!
                </DialogTitle>
                <Sparkles className="h-8 w-8 text-rose-400 ml-2 animate-pulse" />
              </div>
            </div>
            <DialogDescription className="text-rose-200 text-lg">
              Tu plataforma exclusiva para eventos únicos y experiencias sensuales
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 p-4">
            {/* What is this platform */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-rose-500/20">
              <h3 className="text-xl font-semibold text-rose-300 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                ¿Qué es karoVicious?
              </h3>
              <p className="text-rose-100 leading-relaxed">
                karoVicious es un club exclusivo de experiencias para adultos ubicado en Toluca, Estado de México. 
                Nuestra plataforma te permite registrarte de manera segura para eventos únicos, ya sea como pareja 
                o individualmente (single). Ofrecemos un ambiente elegante, discreto y sofisticado para personas 
                que buscan experiencias especiales.
              </p>
            </div>

            {/* How to use */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-rose-500/20">
              <h3 className="text-xl font-semibold text-rose-300 mb-3">
                ¿Cómo usar la plataforma?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Badge className="bg-rose-600/20 text-rose-300">1</Badge>
                  <p className="text-rose-100">
                    <strong>Regístrate:</strong> Crea tu cuenta con un email válido y contraseña segura
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-rose-600/20 text-rose-300">2</Badge>
                  <p className="text-rose-100">
                    <strong>Explora eventos:</strong> Revisa los eventos disponibles con fechas y horarios
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-rose-600/20 text-rose-300">3</Badge>
                  <p className="text-rose-100">
                    <strong>Elige tu tipo:</strong> Selecciona registro en pareja o individual (single)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-rose-600/20 text-rose-300">4</Badge>
                  <p className="text-rose-100">
                    <strong>Reserva tu lugar:</strong> Completa el registro y recibe tu código QR único
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-rose-600/20 text-rose-300">5</Badge>
                  <p className="text-rose-100">
                    <strong>Asiste al evento:</strong> Presenta tu QR en la entrada para acceso instantáneo
                  </p>
                </div>
              </div>
            </div>

            {/* Important policies */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-rose-500/20">
              <h3 className="text-xl font-semibold text-rose-300 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Políticas Importantes
              </h3>
              <div className="space-y-2 text-sm text-rose-100">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Ambiente exclusivo para adultos (+18)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Registro único y sin cancelaciones una vez confirmado</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Códigos QR personales e intransferibles</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Máxima discreción y privacidad garantizada</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Ambiente de respeto mutuo y consenso</span>
                </div>
              </div>
            </div>

            {/* Contact and location */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-rose-500/20">
              <h3 className="text-xl font-semibold text-rose-300 mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Ubicación & Contacto
              </h3>
              <p className="text-rose-100 text-center">
                <strong>P.º Cristóbal Colón 725, Moderna de la Cruz</strong><br />
                50180 Toluca de Lerdo, Estado de México
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleCloseWelcome}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-8 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
            >
              Entendido, comenzar
            </Button>
          </div>
        </DialogContent>
    </Dialog>
  );

  return (
    <>
      <WelcomeModal />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-rose-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-10 w-16 h-16 sm:w-32 sm:h-32 bg-purple-500/30 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-40 right-20 w-12 h-12 sm:w-24 sm:h-24 bg-rose-500/40 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-1/3 w-20 h-20 sm:w-40 sm:h-40 bg-pink-600/25 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-1/2 right-10 w-8 h-8 sm:w-16 sm:h-16 bg-fuchsia-500/35 rounded-full blur-xl animate-pulse-glow delay-500"></div>
        <div className="absolute bottom-40 right-1/4 w-12 h-12 sm:w-24 sm:h-24 bg-violet-600/20 rounded-full blur-2xl animate-float delay-1000"></div>
        <div className="absolute top-10 right-1/3 w-6 h-6 sm:w-12 sm:h-12 bg-rose-400/30 rounded-full blur-lg animate-pulse-glow delay-700"></div>
        <div className="absolute bottom-10 left-20 w-10 h-10 sm:w-20 sm:h-20 bg-purple-400/25 rounded-full blur-2xl animate-float delay-300"></div>
      </div>
      {/* Header */}
      <header className="border-b border-rose-500/30 bg-black/80 backdrop-blur-sm sticky top-0 z-50 animate-fade-in shadow-lg shadow-rose-500/20">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" className="hover:scale-105 transition-transform duration-300" />
            
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="hidden sm:block text-sm text-rose-200">
                  Bienvenido, {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="hover:scale-105 transition-transform border-rose-400/50 text-rose-200 hover:bg-rose-500/20">
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:scale-105 transition-transform border-rose-400/50 text-rose-200 hover:bg-rose-500/20">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate("/login")} className="hover:scale-105 transition-transform text-sm px-3 sm:px-4 border-rose-400/50 text-rose-200 hover:bg-rose-500/20">
                  Iniciar Sesión
                </Button>
                <Button 
                  onClick={() => navigate("/login")} 
                  className="hover:scale-105 transition-transform text-sm px-3 sm:px-4 bg-gradient-to-r from-rose-600 to-purple-600 text-white hover:from-rose-700 hover:to-purple-700 shadow-lg shadow-rose-500/25"
                >
                  Registrarse
                </Button>
                {isAppInstalled === false && (
                  <a 
                    href="https://github.com/karovicious/karovicious/releases/download/untagged-be3aa0c534287476797c/app-release.apk"
                    download="KaroVicious.apk"
                    className="ml-2 inline-flex items-center justify-center rounded-md bg-green-600 px-3 sm:px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 hover:scale-105 transition-transform"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Descargar App</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-black/60 backdrop-blur-sm rounded-lg shadow-xl border border-rose-500/30 mt-4">
        {/* Hero Section */}
        <section className="text-center mb-8 sm:mb-16 relative z-10">
          <div className="max-w-4xl mx-auto animate-fade-in bg-gradient-to-br from-purple-900/80 to-rose-900/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-rose-400/30">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-rose-400 via-red-400 to-rose-300 bg-clip-text text-transparent animate-pulse-glow">
                karoVicious Toluca
              </h2>
              <p className="text-base sm:text-lg text-rose-200 mb-2 animate-fade-in delay-200">Edo. México</p>
              <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-rose-400 to-red-400 mx-auto rounded-full mb-4 sm:mb-6 animate-fade-in delay-300"></div>
            </div>
            
            <h3 className="text-xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white animate-fade-in delay-400">
              Sistema de Gestión de Eventos
            </h3>
            <p className="text-base sm:text-xl text-rose-100 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in delay-500">
              Plataforma exclusiva para la gestión y control de acceso a eventos del club.
              Reserva tu lugar como pareja o single, confirma tu asistencia y accede con códigos QR únicos y seguros.
            </p>
            
            {/* Club Location */}
            <div className="bg-gradient-to-r from-rose-800/50 to-purple-800/50 border border-rose-400/40 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto shadow-lg shadow-rose-500/20 animate-fade-in delay-600 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-rose-300 mr-2 animate-pulse" />
                <h4 className="text-base sm:text-lg font-semibold text-white">Ubicación del Club</h4>
              </div>
              <p className="text-sm sm:text-base text-rose-100 text-center leading-relaxed">
                P.º Cristóbal Colón 725, Moderna de la Cruz<br />
                50180 Toluca de Lerdo, Estado de México
              </p>
            </div>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in delay-700">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 hover:scale-105 transition-transform duration-300 shadow-lg bg-gradient-to-r from-rose-600 to-purple-600 text-white hover:from-rose-700 hover:to-purple-700 shadow-rose-500/25" onClick={() => navigate("/login")}>
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Comenzar Ahora
                </Button>
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 hover:scale-105 transition-transform duration-300 shadow-lg border-rose-400/50 text-rose-200 hover:bg-rose-500/20" onClick={() => navigate("/login")}>
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Iniciar Sesión
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Registration Types Section */}
        <section className="mb-8 sm:mb-16 bg-gradient-to-br from-purple-900/60 to-rose-900/60 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-rose-400/30">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Tipos de Registro</h3>
            <p className="text-sm sm:text-base text-rose-100 max-w-2xl mx-auto px-4">
              Elige el tipo de registro que mejor se adapte a ti
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
            <Card className="border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/25 hover:scale-105 transition-all duration-300 animate-fade-in delay-200">
              <CardHeader className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-rose-300" />
                </div>
                <CardTitle className="text-lg sm:text-xl text-white">Registro en Pareja</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-rose-100">
                  Registro conjunto para dos personas que asistirán juntas al evento
                </p>
                <ul className="text-sm space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white">Un solo código QR para ambos</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white">Acceso simultáneo</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white">Datos de ambas personas requeridos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/25 hover:scale-105 transition-all duration-300 animate-fade-in delay-400">
              <CardHeader className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                  <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-300" />
                </div>
                <CardTitle className="text-lg sm:text-xl text-white">Registro Individual (Single)</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-rose-100">
                  Registro personal para una sola persona
                </p>
                <ul className="text-sm space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white">Código QR individual</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white">Acceso personal único</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white">Solo tus datos personales</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-8 sm:mb-16 px-4 bg-gradient-to-br from-purple-900/60 to-rose-900/60 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-rose-400/30">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 animate-fade-in text-white">Políticas y Términos</h3>
          <p className="text-center text-rose-100 mb-8 max-w-3xl mx-auto">
            Información importante que debes conocer antes de registrarte
          </p>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Terms and Conditions */}
            <Card className="hover:scale-105 transition-transform duration-300 animate-fade-in delay-200 border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/25">
              <CardHeader className="p-4 sm:p-6">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-rose-300 mx-auto mb-4 animate-float" />
                <CardTitle className="text-lg sm:text-xl text-white">Eventos Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-rose-100">
                  Consulta todos los eventos disponibles del club con fechas, 
                  horarios y capacidad en tiempo real.
                </p>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card className="hover:scale-105 transition-transform duration-300 animate-fade-in delay-400 border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/25">
              <CardHeader className="p-4 sm:p-6">
                <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-purple-300 mx-auto mb-4 animate-float delay-500" />
                <CardTitle className="text-lg sm:text-xl text-white">Reserva Tu Lugar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-rose-100">
                  Selecciona el horario que prefieras y reserva tu lugar.
                  El sistema controla automáticamente la capacidad.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Payment & Security Section */}
        <section className="mb-8 sm:mb-16 px-4 bg-gradient-to-br from-purple-900/60 to-rose-900/60 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-rose-400/30">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Payment Methods */}
            <Card className="border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:scale-105 transition-transform duration-300 animate-fade-in delay-200 hover:shadow-lg hover:shadow-rose-500/25">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-lg sm:text-xl text-white">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-rose-300 mr-2 animate-pulse" />
                  Métodos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 text-white">💳 Pago en Efectivo</h5>
                    <p className="text-sm text-rose-100">
                      Pago directo en la recepción del club al momento del evento
                    </p>
                  </div>
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 text-white">📱 Transferencia Bancaria</h5>
                    <p className="text-sm text-rose-100">
                      Comprobante de pago requerido al registrarse
                    </p>
                  </div>
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 text-white">🎫 Eventos Gratuitos</h5>
                    <p className="text-sm text-rose-100">
                      Solo requieren registro previo con código QR
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:scale-105 transition-transform duration-300 animate-fade-in delay-400 hover:shadow-lg hover:shadow-rose-500/25">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-lg sm:text-xl text-white">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300 mr-2 animate-pulse" />
                  Seguridad y Privacidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 text-white">🔒 Datos Protegidos</h5>
                    <p className="text-sm text-rose-100">
                      Información personal encriptada y protegida
                    </p>
                  </div>
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 text-white">🆔 Códigos QR Únicos</h5>
                    <p className="text-sm text-rose-100">
                      Generación única por evento, imposible de duplicar
                    </p>
                  </div>
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 text-white">🔐 Acceso Controlado</h5>
                    <p className="text-sm text-rose-100">
                      Solo personal autorizado puede acceder códigos QR
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Instructions Section */}
        <section className="mb-8 sm:mb-16 px-4 bg-gradient-to-br from-purple-900/60 to-rose-900/60 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-rose-400/30">
          <Card className="max-w-6xl mx-auto hover:scale-105 transition-transform duration-300 animate-fade-in">
            <CardHeader className="text-center p-4 sm:p-6">
              <CardTitle className="text-2xl sm:text-3xl">Instrucciones Detalladas</CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Guía completa paso a paso para usar el sistema de eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center">
                    <Badge className="mr-2">1</Badge>
                    Para Usuarios
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Regístrate con tu email y crea una contraseña segura</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Explora los eventos disponibles y sus horarios</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Reserva tu lugar en el evento y horario preferido</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Guarda tu código QR para presentar en el evento</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Presenta tu QR en la entrada para registro automático</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center">
                    <Badge className="mr-2">2</Badge>
                    Para Administradores
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Accede al panel de administración con credenciales</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Crea y gestiona eventos, fechas y horarios</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Escanea códigos QR para verificar asistencia</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Controla capacidad y registra entradas en tiempo real</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Visualiza reportes y estadísticas de eventos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Info Cards */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Users className="h-5 w-5 mr-2" />
                Control de Capacidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                El sistema automáticamente controla la capacidad máxima de cada evento
                y horario, evitando sobrecupo y garantizando una experiencia óptima.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <QrCode className="h-5 w-5 mr-2" />
                Códigos QR Únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Cada reservación genera un código QR único e irrepetible,
                garantizando la seguridad y evitando duplicaciones o fraudes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Shield className="h-5 w-5 mr-2" />
                Gestión Segura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Sistema seguro con autenticación robusta, roles de usuario
                y políticas de acceso que protegen la información del club.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Comprehensive Policies Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Políticas y Términos</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Información importante que debes conocer antes de registrarte
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Registration Policies */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-xl text-destructive flex items-center">
                  <QrCode className="h-6 w-6 mr-2" />
                  Políticas de Registro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-card rounded-lg border border-destructive/20">
                    <h5 className="font-semibold mb-2 text-destructive">🚫 SIN CANCELACIONES</h5>
                    <p className="text-muted-foreground">
                      Una vez realizado el registro para cualquier evento, <strong>NO hay cancelaciones posibles</strong>. 
                      La reservación es definitiva y no se pueden hacer cambios.
                    </p>
                  </div>
                  <div className="p-3 bg-card rounded-lg">
                    <h5 className="font-semibold mb-2">📅 Registro Único</h5>
                    <p className="text-muted-foreground">
                      Solo se permite una reservación por usuario por evento. 
                      Selecciona cuidadosamente tu tipo de registro (pareja o single).
                    </p>
                  </div>
                  <div className="p-3 bg-card rounded-lg">
                    <h5 className="font-semibold mb-2">⏰ Confirmación Inmediata</h5>
                    <p className="text-muted-foreground">
                      Al completar el registro, tu lugar queda confirmado automáticamente. 
                      No hay periodo de gracia para cambios.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card className="border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/25">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl mb-4 flex items-center text-white">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-rose-300 mr-2" />
                  Términos y Condiciones
                </CardTitle>
                <CardDescription className="space-y-4">
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 flex items-center text-white">
                      <Info className="h-4 w-4 mr-2 text-rose-300" />
                      📋 Datos Requeridos
                    </h5>
                    <p className="text-sm text-rose-100 mb-2">
                      <strong>Registro Individual:</strong> Nombre completo, email, teléfono
                    </p>
                    <p className="text-sm text-rose-100">
                      <strong>Registro en Pareja:</strong> Datos completos de ambas personas
                    </p>
                  </div>
                  
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 flex items-center text-white">
                      <Shield className="h-4 w-4 mr-2 text-purple-300" />
                      💰 Política de Pagos
                    </h5>
                    <p className="text-sm text-rose-100">
                      Los pagos son NO REEMBOLSABLES. Para eventos de pago, el comprobante debe presentarse 
                      junto con el código QR.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-black/30 border border-rose-400/20 rounded-lg">
                    <h5 className="font-semibold mb-1 flex items-center text-white">
                      <QrCode className="h-4 w-4 mr-2 text-fuchsia-300" />
                      🆔 Acceso al Evento
                    </h5>
                    <p className="text-sm text-rose-100">
                      El código QR es OBLIGATORIO para el acceso. Sin excepción, no se permite entrada sin código 
                      válido.
                    </p>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Additional Rules */}
          <Card className="border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/25">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-center text-white">
                <Users className="h-6 w-6 mr-2 text-rose-300" />
                Reglas Adicionales del Club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <h5 className="font-semibold mb-2 text-white">👔 Código de Vestimenta</h5>
                  <p className="text-rose-100">
                    Vestimenta apropiada requerida según el tipo de evento. 
                    Consulta los detalles específicos en cada evento.
                  </p>
                </div>
                <div className="text-center">
                  <h5 className="font-semibold mb-2 text-white">🔞 Restricciones de Edad</h5>
                  <p className="text-rose-100">
                    Algunos eventos pueden tener restricciones de edad. 
                    Verificación de ID requerida en la entrada.
                  </p>
                </div>
                <div className="text-center">
                  <h5 className="font-semibold mb-2 text-white">📱 Uso del Código QR</h5>
                  <p className="text-rose-100">
                    El código QR es personal e intransferible. 
                    Compartirlo con terceros puede resultar en denegación de acceso.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Info */}
        <section className="text-center mb-8 sm:mb-16 px-4 bg-gradient-to-br from-purple-900/60 to-rose-900/60 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-rose-400/30">
          <Card className="max-w-2xl mx-auto border-rose-400/30 bg-gradient-to-br from-purple-800/40 to-rose-800/40 backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/25">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-2xl text-white">
                <MapPin className="h-6 w-6 mr-2 text-rose-300" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <h5 className="font-semibold text-white">📧 Contacto Digital</h5>
                  <p className="flex items-center justify-center text-rose-100">
                    <Mail className="h-4 w-4 mr-2 text-rose-300" />
                    contacto@karovicious.com
                  </p>
                  <p className="flex items-center justify-center text-rose-100">
                    <Phone className="h-4 w-4 mr-2 text-purple-300" />
                    +52 722 123 4567
                  </p>
                </div>
                <div className="space-y-3">
                  <h5 className="font-semibold text-white">📍 Ubicación Física</h5>
                  <div className="text-center text-rose-100">
                    <p>P.º Cristóbal Colón 725</p>
                    <p>Moderna de la Cruz</p>
                    <p>50180 Toluca de Lerdo, Méx.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-rose-500/30 bg-black/60 backdrop-blur-sm py-6 sm:py-8 mt-8 sm:mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Logo size="sm" />
              <span className="text-sm text-rose-200">© 2024 karoVicious. Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-rose-100">Plataforma exclusiva para adultos (+18)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Index;
