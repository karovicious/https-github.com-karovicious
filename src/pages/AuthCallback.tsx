import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando tu email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Hubo un problema al confirmar tu email. Serás redirigido al login.');
          toast({
            title: "Error de autenticación",
            description: "Hubo un problema al confirmar tu email. Inténtalo de nuevo.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('¡Tu cuenta ha sido verificada exitosamente! Serás redirigido al inicio.');
          toast({
            title: "¡Email confirmado!",
            description: "Tu cuenta ha sido verificada exitosamente.",
          });
          setTimeout(() => navigate('/'), 2000);
        } else {
          setStatus('error');
          setMessage('No se pudo verificar tu sesión. Serás redirigido al login.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage('Ocurrió un error inesperado. Serás redirigido al login.');
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-rose-900 to-fuchsia-900">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative z-10 text-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-rose-500/20 shadow-2xl shadow-rose-500/20 max-w-md mx-4">
        <div className="mb-6">
          <Logo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Karo Vicious69</h1>
        </div>

        <div className="mb-6">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 text-rose-400 mx-auto mb-4 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4 animate-pulse" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4 animate-pulse" />
          )}
        </div>

        <p className={`text-lg font-medium mb-4 ${
          status === 'success' ? 'text-green-200' : 
          status === 'error' ? 'text-red-200' : 
          'text-rose-100'
        }`}>
          {message}
        </p>

        {status === 'success' && (
          <div className="text-sm text-rose-200/80">
            ¡Bienvenido a nuestra comunidad exclusiva! 🎉
          </div>
        )}

        {status === 'error' && (
          <div className="text-sm text-red-200/80">
            Si el problema persiste, contacta con soporte.
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
