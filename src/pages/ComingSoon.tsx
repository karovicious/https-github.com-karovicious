import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Sparkles, Heart, Star } from "lucide-react";

const ComingSoon = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    setMounted(true);
    
    // Generar sparkles aleatorios
    const newSparkles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3
    }));
    setSparkles(newSparkles);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-rose-900 to-fuchsia-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Sparkles */}
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="absolute animate-pulse"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: '3s'
            }}
          >
            <Sparkles className="h-4 w-4 text-rose-300/30" />
          </div>
        ))}

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className={`max-w-2xl w-full bg-black/40 backdrop-blur-xl border-rose-500/30 shadow-2xl transform transition-all duration-1000 ${
          mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
        }`}>
          <CardContent className="p-8 sm:p-12 text-center space-y-8">
            {/* Logo Container */}
            <div className={`relative mx-auto w-32 h-32 sm:w-40 sm:h-40 transform transition-all duration-1000 delay-300 ${
              mounted ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-rose-400/50 shadow-2xl">
                <img 
                  src="/karologo_400x400.jpg" 
                  alt="Karo Vicious Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Hearts */}
              <Heart className="absolute -top-2 -right-2 h-6 w-6 text-rose-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
              <Star className="absolute -bottom-2 -left-2 h-5 w-5 text-purple-400 animate-bounce" style={{ animationDelay: '1s' }} />
            </div>

            {/* Title */}
            <div className={`space-y-4 transform transition-all duration-1000 delay-500 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-rose-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-pulse">
                ¡Próximamente!
              </h1>
              <div className="flex items-center justify-center space-x-2 text-rose-300">
                <Clock className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-lg font-medium">Sistema de Pagos</span>
              </div>
            </div>

            {/* Message */}
            <div className={`space-y-6 transform transition-all duration-1000 delay-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}>
              <div className="bg-gradient-to-r from-purple-800/30 to-rose-800/30 rounded-xl p-6 border border-rose-400/20">
                <p className="text-rose-100 text-lg leading-relaxed">
                  Estamos trabajando en una <span className="font-semibold text-rose-300">experiencia de pago excepcional</span> para nuestros miembros exclusivos.
                </p>
                <p className="text-rose-200/80 mt-4">
                  Nuestro equipo está desarrollando un sistema seguro y elegante que estará disponible muy pronto.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-purple-300">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Gracias por tu paciencia</span>
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
            </div>

            {/* Back Button */}
            <div className={`transform transition-all duration-1000 delay-1000 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}>
              <Button
                onClick={handleGoBack}
                className="group bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                Regresar
              </Button>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 opacity-20">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent"></div>
    </div>
  );
};

export default ComingSoon;
