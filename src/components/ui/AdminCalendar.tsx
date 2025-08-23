import React, { useState } from 'react';
import EventCalendar from './EventCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Settings } from 'lucide-react';

interface AdminCalendarProps {
  userId: string;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ userId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    location: '',
    capacity: '',
    is_public: true
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description || null,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at || null,
          location: formData.location || null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          is_public: formData.is_public,
          organizer_id: userId
        });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo crear el evento",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Evento creado!",
        description: "El evento ha sido creado exitosamente",
      });

      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        starts_at: '',
        ends_at: '',
        location: '',
        capacity: '',
        is_public: true
      });
    } catch (err) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al crear el evento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel de Control Admin */}
      <Card className="bg-gradient-to-r from-purple-900/40 to-rose-900/40 backdrop-blur-md border-rose-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-rose-400" />
              Panel de Administración
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-purple-900/95 to-rose-900/95 backdrop-blur-md border-rose-500/20 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Evento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      className="bg-black/20 border-rose-500/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-black/20 border-rose-500/30 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="starts_at">Fecha/Hora Inicio *</Label>
                      <Input
                        id="starts_at"
                        type="datetime-local"
                        value={formData.starts_at}
                        onChange={(e) => setFormData({...formData, starts_at: e.target.value})}
                        required
                        className="bg-black/20 border-rose-500/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ends_at">Fecha/Hora Fin</Label>
                      <Input
                        id="ends_at"
                        type="datetime-local"
                        value={formData.ends_at}
                        onChange={(e) => setFormData({...formData, ends_at: e.target.value})}
                        className="bg-black/20 border-rose-500/30 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="bg-black/20 border-rose-500/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacidad</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                        className="bg-black/20 border-rose-500/30 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                    />
                    <Label htmlFor="is_public">Evento Público</Label>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700">
                    Crear Evento
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Calendario Principal */}
      <EventCalendar isAdmin={true} userId={userId} />
    </div>
  );
};

export default AdminCalendar;
