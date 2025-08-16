import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, CheckCircle, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Reservation {
  id: string;
  full_name: string;
  email: string;
  status: string;
  qr_token: string;
  reserved_at: string;
  events: {
    title: string;
  };
  schedules?: {
    scheduled_at: string;
  };
}

const Admin = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Error al acceder a la cámara",
        description: "Verifica los permisos de cámara",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const searchByToken = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          events (title),
          schedules (scheduled_at)
        `)
        .eq("qr_token", token.trim())
        .single();

      if (error || !data) {
        toast({
          title: "Reservación no encontrada",
          description: "El código QR no es válido",
          variant: "destructive",
        });
        setReservation(null);
        return;
      }

      setReservation(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al buscar la reservación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkInReservation = async () => {
    if (!reservation) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "checked_in" })
        .eq("id", reservation.id);

      if (error) {
        toast({
          title: "Error al registrar entrada",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setReservation({
        ...reservation,
        status: "checked_in"
      });

      toast({
        title: "¡Entrada registrada!",
        description: `${reservation.full_name} ha sido registrado`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al registrar la entrada",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    const token = prompt("Ingresa el código QR manualmente:");
    if (token) {
      searchByToken(token);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">Confirmado</Badge>;
      case "checked_in":
        return <Badge className="bg-green-500">Registrado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Escanea códigos QR para verificar entradas</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Scanner Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Escáner QR
              </CardTitle>
              <CardDescription>
                Usa la cámara para escanear códigos QR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isScanning ? (
                <div className="space-y-3">
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Cámara
                  </Button>
                  <Button variant="outline" onClick={handleManualInput} className="w-full">
                    Ingresar código manualmente
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-primary w-48 h-48 rounded-lg" />
                    </div>
                  </div>
                  <Button variant="outline" onClick={stopCamera} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Detener Cámara
                  </Button>
                  <Button variant="outline" onClick={handleManualInput} className="w-full">
                    Ingresar código manualmente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reservation Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Reservación</CardTitle>
              <CardDescription>
                Detalles de la reservación escaneada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Buscando reservación...</p>
                </div>
              ) : reservation ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{reservation.full_name}</h3>
                    {getStatusBadge(reservation.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> {reservation.email}</p>
                    <p><strong>Evento:</strong> {reservation.events.title}</p>
                    {reservation.schedules && (
                      <p><strong>Horario:</strong> {new Date(reservation.schedules.scheduled_at).toLocaleString()}</p>
                    )}
                    <p><strong>Reservado:</strong> {new Date(reservation.reserved_at).toLocaleString()}</p>
                  </div>

                  {reservation.status === "confirmed" && (
                    <Button onClick={checkInReservation} className="w-full" disabled={loading}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Registrar Entrada
                    </Button>
                  )}

                  {reservation.status === "checked_in" && (
                    <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-600 font-medium">Ya registrado</span>
                    </div>
                  )}

                  {reservation.status === "cancelled" && (
                    <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-red-600 font-medium">Reservación cancelada</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Escanea un código QR para ver la información</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="font-medium">Política de Eventos</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sin cambios ni reembolsos una vez confirmada la reservación.
                Los asistentes deben presentar su código QR para el ingreso.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;