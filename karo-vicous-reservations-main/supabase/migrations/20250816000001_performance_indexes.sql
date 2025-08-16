DROP INDEX IF EXISTS idx_events_dates;
DROP INDEX IF EXISTS idx_reservations_status;
DROP INDEX IF EXISTS idx_reservations_user_status;
DROP INDEX IF EXISTS idx_schedules_date;
DROP INDEX IF EXISTS idx_events_created_at;
DROP INDEX IF EXISTS idx_reservations_created_at;
DROP INDEX IF EXISTS idx_schedules_created_at;
DROP INDEX IF EXISTS idx_active_reservations;
DROP INDEX IF EXISTS idx_events_text_search;

CREATE INDEX idx_events_dates ON events (starts_at, ends_at);

CREATE INDEX idx_reservations_status ON reservations (status);

CREATE INDEX idx_reservations_user_status ON reservations (user_id, status);

CREATE INDEX idx_schedules_date ON schedules (scheduled_at);

CREATE INDEX idx_events_created_at ON events USING brin (created_at);
CREATE INDEX idx_reservations_created_at ON reservations USING brin (created_at);
CREATE INDEX idx_schedules_created_at ON schedules USING brin (created_at);

CREATE INDEX idx_active_reservations ON reservations (event_id) 
    WHERE status = 'confirmed';

-- Comentarios en los índices
comment on index idx_events_dates is 'Optimizes queries filtering by event dates';
comment on index idx_reservations_status is 'Optimizes queries filtering by reservation status';
comment on index idx_reservations_user_status is 'Optimizes queries for user reservations with specific status';
comment on index idx_schedules_date is 'Optimizes queries filtering schedules by date';
comment on index idx_events_created_at is 'Optimizes time-series queries on events';
comment on index idx_reservations_created_at is 'Optimizes time-series queries on reservations';
comment on index idx_schedules_created_at is 'Optimizes time-series queries on schedules';
comment on index idx_active_reservations is 'Optimizes queries for confirmed reservations';
comment on index idx_events_text_search is 'Enables full text search on events';
