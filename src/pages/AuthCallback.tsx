import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Error de autenticación",
            description: "Hubo un problema al confirmar tu email. Inténtalo de nuevo.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        if (data.session) {
          toast({
            title: "¡Email confirmado!",
            description: "Tu cuenta ha sido verificada exitosamente.",
          });
          navigate('/');
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Confirmando tu email...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
