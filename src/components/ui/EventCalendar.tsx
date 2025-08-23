import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  capacity: number | null;
  is_public: boolean;
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

interface EventCalendarProps {
  isAdmin?: boolean;
  userId?: string;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ isAdmin = false, userId }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Cargar eventos desde Supabase
  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('starts_at', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos",
          variant: "destructive",
        });
        return;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar los eventos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos para la fecha seleccionada
  useEffect(() => {
    const eventsForDate = events.filter(event => 
      isSameDay(parseISO(event.starts_at), selectedDate)
    );
    setSelectedDateEvents(eventsForDate);
  }, [selectedDate, events]);

  // Cargar eventos al montar el componente
  useEffect(() => {
    loadEvents();
  }, []);

  // Obtener fechas que tienen eventos
  const getEventDates = () => {
    return events.map(event => parseISO(event.starts_at));
  };

  // Reservar evento (solo para usuarios) - Temporalmente redirige a página de próximamente
  const handleReserveEvent = async (eventId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para reservar",
        variant: "destructive",
      });
      return;
    }

    // Redirigir a página de próximamente para pagos
    window.open('/coming-soon', '_blank');
  };

  const formatEventTime = (startTime: string, endTime?: string | null) => {
    const start = format(parseISO(startTime), 'HH:mm', { locale: es });
    if (endTime) {
      const end = format(parseISO(endTime), 'HH:mm', { locale: es });
      return `${start} - ${end}`;
    }
    return start;
  };

  const getEventStatusColor = (event: Event) => {
    const now = new Date();
    const eventStart = parseISO(event.starts_at);
    
    if (eventStart < now) {
      return 'bg-gray-500'; // Pasado
    } else if (event.is_public) {
      return 'bg-green-500'; // Público
    } else {
      return 'bg-purple-500'; // Privado
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del Calendario */}
      <Card className="bg-gradient-to-r from-purple-900/40 to-rose-900/40 backdrop-blur-md border-rose-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CalendarIcon className="h-6 w-6 text-rose-400" />
            {isAdmin ? 'Calendario de Administrador' : 'Calendario de Eventos'}
          </CardTitle>
          <CardDescription className="text-rose-100/80">
            {isAdmin 
              ? 'Gestiona y visualiza todos los eventos del club'
              : 'Explora y reserva eventos exclusivos'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendario */}
        <Card className="bg-black/40 backdrop-blur-md border-rose-500/20">
          <CardHeader>
            <CardTitle className="text-white">
              {format(selectedDate, 'MMMM yyyy', { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border border-rose-500/20"
              modifiers={{
                hasEvent: getEventDates()
              }}
              modifiersStyles={{
                hasEvent: { 
                  backgroundColor: 'rgba(236, 72, 153, 0.3)',
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 text-sm text-rose-200/60">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-400/30 rounded"></div>
                <span>Días con eventos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Eventos del Día Seleccionado */}
        <Card className="bg-black/40 backdrop-blur-md border-rose-500/20">
          <CardHeader>
            <CardTitle className="text-white">
              Eventos - {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
            </CardTitle>
            <CardDescription className="text-rose-100/80">
              {selectedDateEvents.length === 0 
                ? 'No hay eventos programados para este día'
                : `${selectedDateEvents.length} evento(s) programado(s)`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400 mx-auto"></div>
                <p className="text-rose-200/60 mt-2">Cargando eventos...</p>
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-rose-400/50 mx-auto mb-4" />
                <p className="text-rose-200/60">No hay eventos este día</p>
                {isAdmin && (
                  <Button 
                    className="mt-4 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
                    onClick={() => {/* TODO: Implementar creación de eventos */}}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Evento
                  </Button>
                )}
              </div>
            ) : (
              selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg bg-gradient-to-r from-purple-800/30 to-rose-800/30 border border-rose-400/20 hover:border-rose-400/40 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDialog(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                      <div className="space-y-1 text-sm text-rose-200/80">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatEventTime(event.starts_at, event.ends_at)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.capacity && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Capacidad: {event.capacity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        className={`${getEventStatusColor(event)} text-white`}
                      >
                        {event.is_public ? 'Público' : 'Privado'}
                      </Badge>
                      {!isAdmin && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReserveEvent(event.id);
                          }}
                        >
                          Reservar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalles del Evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-gradient-to-br from-purple-900/95 to-rose-900/95 backdrop-blur-md border-rose-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-rose-100/80">
              Detalles del evento
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <h4 className="font-semibold text-rose-200 mb-2">Descripción</h4>
                  <p className="text-rose-100/80">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-rose-200 mb-2">Fecha y Hora</h4>
                  <div className="space-y-1 text-sm text-rose-100/80">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(parseISO(selectedEvent.starts_at), 'dd MMMM yyyy', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatEventTime(selectedEvent.starts_at, selectedEvent.ends_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-rose-200 mb-2">Información</h4>
                  <div className="space-y-1 text-sm text-rose-100/80">
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    {selectedEvent.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Capacidad: {selectedEvent.capacity}</span>
                      </div>
                    )}
                    <Badge 
                      className={`${getEventStatusColor(selectedEvent)} text-white w-fit`}
                    >
                      {selectedEvent.is_public ? 'Evento Público' : 'Evento Privado'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {!isAdmin && (
                <div className="pt-4 border-t border-rose-500/20">
                  <Button
                    className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
                    onClick={() => {
                      handleReserveEvent(selectedEvent.id);
                      setShowEventDialog(false);
                    }}
                  >
                    Reservar Este Evento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCalendar;
