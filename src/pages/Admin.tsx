import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Logo from "@/components/ui/Logo";
import {
  Camera,
  CheckCircle,
  X,
  AlertCircle,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  LogOut,
  UserCheck,
  TrendingUp,
  Activity,
  Shield,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

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

interface UserProfile {
  id: string;
  email?: string;
  role: 'admin' | 'organizer' | 'user';
  created_at: string;
  user_id: string;
}

interface DashboardStats {
  totalUsers: number;
  totalReservations: number;
  totalRevenue: number;
  conversionRate: number;
  pendingReservations: number;
  confirmedReservations: number;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReservations: 0,
    totalRevenue: 0,
    conversionRate: 0,
    pendingReservations: 0,
    confirmedReservations: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);

      // Check if user is admin using user_roles table
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error || !userRole || userRole.role !== 'admin') {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de administrador",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setUserProfile({
        id: userRole.id,
        user_id: userRole.user_id,
        role: userRole.role,
        created_at: userRole.created_at,
        email: session.user.email
      });
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/login');
    }
  }, [navigate]);

  const loadDashboardData = useCallback(async () => {
    try {
      setDashboardLoading(true);

      // Load all user roles
      const { data: usersData, error: usersError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers((usersData as UserProfile[]) || []);

      // Load all reservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          events (title),
          schedules (scheduled_at)
        `)
        .order('reserved_at', { ascending: false });

      if (reservationsError) throw reservationsError;
      setReservations(reservationsData || []);

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const totalReservations = reservationsData?.length || 0;
      const pendingReservations = reservationsData?.filter(r => r.status === 'pending').length || 0;
      const confirmedReservations = reservationsData?.filter(r => r.status === 'confirmed').length || 0;
      
      setStats({
        totalUsers,
        totalReservations,
        totalRevenue: totalReservations * 500, // Mock calculation
        conversionRate: totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0,
        pendingReservations,
        confirmedReservations
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAdmin = async () => {
      await checkAdminAccess();
      await loadDashboardData();
    };
    initializeAdmin();
  }, [checkAdminAccess, loadDashboardData]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'organizer' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido actualizado a ${newRole}`,
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

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

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950/30 to-rose-900/40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando panel de administrador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/30 to-rose-900/40">
      {/* Header */}
      <header className="border-b border-rose-500/20 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <div>
                <h1 className="text-xl font-bold text-primary">Panel de Administrador</h1>
                <p className="text-sm text-muted-foreground">Sistema de gestión KaroVicious</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{userProfile?.email || user?.email}</p>
                <Badge variant="destructive" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrador
                </Badge>
              </div>
              <Button variant="outline" onClick={() => navigate('/')}>
                <Activity className="h-4 w-4 mr-2" />
                Ver Sitio
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservaciones</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReservations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingReservations} pendientes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Est.</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Ingresos estimados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Confirmación</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Reservaciones confirmadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="reservations" className="data-[state=active]:bg-primary">
              <Calendar className="h-4 w-4 mr-2" />
              Reservaciones
            </TabsTrigger>
            <TabsTrigger value="scanner" className="data-[state=active]:bg-primary">
              <Camera className="h-4 w-4 mr-2" />
              Escáner QR
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-primary">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Administra los roles y permisos de los usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <UserCheck className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{user.email || user.user_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Creado: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                          {user.role}
                        </Badge>
                        <Select
                          value={user.role}
                          onValueChange={(newRole: 'admin' | 'organizer' | 'user') => 
                            updateUserRole(user.user_id, newRole)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="organizer">Organizador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-4">
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle>Reservaciones Recientes</CardTitle>
                <CardDescription>
                  Lista de todas las reservaciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.slice(0, 10).map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{res.full_name}</p>
                          <p className="text-sm text-muted-foreground">{res.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(res.reserved_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(res.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {res.events?.title || 'Evento'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Scanner Tab */}
          <TabsContent value="scanner" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Scanner Card */}
              <Card className="bg-card/80 backdrop-blur border-primary/20">
                <CardHeader>
                  <CardTitle>Escáner QR</CardTitle>
                  <CardDescription>
                    Usa la cámara para escanear códigos QR de reservaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isScanning ? (
                    <div className="space-y-4">
                      <Button onClick={startCamera} className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Iniciar Cámara
                      </Button>
                      <Button variant="outline" onClick={handleManualInput} className="w-full">
                        Ingresar código manualmente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-64 object-cover rounded-lg bg-black"
                        />
                        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
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
              <Card className="bg-card/80 backdrop-blur border-primary/20">
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
                        <p><strong>Evento:</strong> {reservation.events?.title}</p>
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
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur border-primary/20">
                <CardHeader>
                  <CardTitle>Resumen de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Usuarios Totales:</span>
                      <span className="font-bold">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reservaciones Totales:</span>
                      <span className="font-bold">{stats.totalReservations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pendientes:</span>
                      <span className="font-bold text-yellow-500">{stats.pendingReservations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confirmadas:</span>
                      <span className="font-bold text-green-500">{stats.confirmedReservations}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-primary/20">
                <CardHeader>
                  <CardTitle>Ingresos Estimados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      ${stats.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-muted-foreground">
                      Basado en {stats.totalReservations} reservaciones
                    </p>
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm">
                        Tasa de confirmación: <strong>{stats.conversionRate.toFixed(1)}%</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;