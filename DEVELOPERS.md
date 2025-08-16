# Guía para Desarrolladores - KaroVicious Reservations

## Estructura de la Base de Datos

### Tablas Principales
1. **events**
   - Almacena información de eventos
   - Campos clave: id, title, description, capacity, starts_at, ends_at
   - Índices: 
     - `idx_events_organizer` (organizer_id)

2. **schedules**
   - Sesiones específicas de eventos
   - Campos clave: id, event_id, scheduled_at, capacity
   - Índices:
     - `idx_schedules_event` (event_id)

3. **reservations**
   - Gestiona las reservaciones de usuarios
   - Campos clave: id, event_id, schedule_id, user_id, status
   - Índices actuales:
     - Índice único en qr_token

4. **user_roles**
   - Gestión de roles de usuario
   - Campos clave: id, user_id, role
   - Índices:
     - Restricción única en (user_id, role)

### Tipos Enumerados
- `app_role`: admin, organizer, user
- `reservation_status`: pending, confirmed, cancelled, checked_in

### Seguridad
- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de acceso específicas por rol
- Validaciones a nivel de base de datos

## Optimizaciones de Rendimiento

### Índices Adicionales Recomendados
```sql
-- Índice para búsquedas de eventos por fecha
CREATE INDEX idx_events_dates ON public.events(starts_at, ends_at);

-- Índice para búsquedas de reservaciones por estado
CREATE INDEX idx_reservations_status ON public.reservations(status);

-- Índice para búsquedas de reservaciones por usuario y estado
CREATE INDEX idx_reservations_user_status ON public.reservations(user_id, status);

-- Índice para búsquedas de horarios por fecha
CREATE INDEX idx_schedules_date ON public.schedules(scheduled_at);
```

### Procedimientos de Backup

#### Backup Manual
```bash
# Exportar la base de datos completa
pg_dump -h aafvhroqhrnacutprujn.supabase.co -U postgres -F c -b -v -f backup.sql

# Exportar solo los datos
pg_dump -h aafvhroqhrnacutprujn.supabase.co -U postgres --data-only -F c -b -v -f data_backup.sql
```

#### Restauración
```bash
# Restaurar la base de datos
pg_restore -h aafvhroqhrnacutprujn.supabase.co -U postgres -d database_name backup.sql
```

## Mantenimiento

### Scripts de Limpieza
```sql
-- Eliminar reservaciones canceladas antiguas
DELETE FROM public.reservations 
WHERE status = 'cancelled' 
AND cancelled_at < NOW() - INTERVAL '6 months';

-- Archivar eventos pasados
UPDATE public.events 
SET is_public = false 
WHERE ends_at < NOW() - INTERVAL '1 month';
```

### Monitoreo de Rendimiento
```sql
-- Consulta para identificar tablas que necesitan VACUUM
SELECT 
  schemaname, 
  relname, 
  n_dead_tup, 
  n_live_tup, 
  n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0) AS dead_percentage
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_percentage DESC;
```

## Políticas de Caché

### Estrategias de Caché Recomendadas
1. Cachear resultados de eventos públicos
2. Cachear conteos de reservaciones por evento
3. Implementar caché de sesión para datos de usuario

### Ejemplo de Implementación de Caché
```typescript
// Ejemplo de caché para eventos públicos
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let eventsCache = {
  data: null,
  timestamp: 0
};

async function getPublicEvents() {
  if (Date.now() - eventsCache.timestamp < CACHE_TTL) {
    return eventsCache.data;
  }

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('is_public', true)
    .order('starts_at');

  eventsCache = {
    data,
    timestamp: Date.now()
  };

  return data;
}
```

## Buenas Prácticas

### Consultas
1. Utilizar paginación en todas las listas
2. Implementar filtros del lado del servidor
3. Usar transacciones para operaciones múltiples

### Ejemplo de Paginación
```typescript
const ITEMS_PER_PAGE = 10;

async function getEventsByPage(page: number) {
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  return await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('starts_at');
}
```

## Ejemplos de Consultas Optimizadas

### 1. Búsqueda de Eventos por Fecha

```typescript
// Función para buscar eventos en un rango de fechas
async function findEventsByDateRange(startDate: Date, endDate: Date) {
  return await supabase
    .from('events')
    .select(`
      *,
      schedules (
        id,
        scheduled_at,
        capacity
      )
    `)
    .gte('starts_at', startDate.toISOString())
    .lte('ends_at', endDate.toISOString())
    .order('starts_at', { ascending: true });
}

// Ejemplo de uso:
const nextWeekEvents = await findEventsByDateRange(
  new Date(), 
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
);
```

### 2. Filtrado de Reservaciones por Estado

```typescript
// Función para obtener reservaciones por estado
async function getReservationsByStatus(
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in',
  page = 0,
  pageSize = 10
) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  return await supabase
    .from('reservations')
    .select(`
      *,
      events (
        title,
        starts_at,
        location
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, to);
}

// Ejemplo de uso:
const confirmedReservations = await getReservationsByStatus('confirmed');
```

### 3. Búsqueda de Reservaciones por Usuario

```typescript
// Función para obtener todas las reservaciones de un usuario
async function getUserReservations(
  userId: string,
  status?: 'pending' | 'confirmed' | 'cancelled' | 'checked_in'
) {
  let query = supabase
    .from('reservations')
    .select(`
      *,
      events (
        title,
        description,
        starts_at,
        ends_at,
        location
      ),
      schedules (
        scheduled_at,
        capacity
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  return await query;
}

// Ejemplo de uso:
const userConfirmedReservations = await getUserReservations(
  'user-123', 
  'confirmed'
);
```

### 4. Consultas Temporales

```typescript
// Función para obtener estadísticas de reservaciones por período
async function getReservationStats(
  startDate: Date,
  endDate: Date
) {
  return await supabase
    .from('reservations')
    .select(`
      status,
      count(*) as total,
      events (
        title
      )
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .group('status, events.title');
}

// Función para obtener eventos actualizados recientemente
async function getRecentlyUpdatedEvents(hours = 24) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await supabase
    .from('events')
    .select('*')
    .gte('updated_at', cutoffDate.toISOString())
    .order('updated_at', { ascending: false });
}
```

### 5. Búsqueda de Texto Completo en Eventos

```typescript
// Función para búsqueda de texto completo en eventos
async function searchEvents(
  searchTerm: string,
  page = 0,
  pageSize = 10
) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Preparar el término de búsqueda para texto completo
  const searchQuery = searchTerm
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');

  return await supabase
    .from('events')
    .select(`
      *,
      schedules (
        scheduled_at,
        capacity
      )
    `)
    .textSearch(
      'title || \' \' || COALESCE(description, \'\')',
      searchQuery,
      {
        config: 'spanish'
      }
    )
    .range(from, to);
}

// Ejemplo de uso:
const searchResults = await searchEvents('concierto música');
```

### Notas de Rendimiento

1. **Índices Utilizados**:
   - `idx_events_dates` para búsquedas por fecha
   - `idx_reservations_status` para filtrado por estado
   - `idx_reservations_user_status` para búsquedas de usuario
   - `idx_events_text_search` para búsqueda de texto completo
   - Índices BRIN en `created_at` y `updated_at` para consultas temporales

2. **Optimizaciones**:
   - Uso de paginación en todas las consultas que pueden retornar muchos resultados
   - Selección específica de columnas para reducir el tamaño de la respuesta
   - Índices compuestos para consultas frecuentes
   - Configuración de búsqueda de texto en español

3. **Monitoreo de Rendimiento**:
   - Usar `explain analyze` para verificar el uso de índices
   - Monitorear tiempos de respuesta
   - Ajustar tamaños de página según necesidad

## Monitoreo y Logging

### Queries a Monitorear
```sql
-- Consultas lentas
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE pg_stat_activity.query != ''::text 
AND state != 'idle'
AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;
```

### Métricas Importantes
1. Tiempo promedio de respuesta por endpoint
2. Número de reservaciones concurrentes
3. Tasa de cancelaciones
4. Uso de caché vs consultas a DB
