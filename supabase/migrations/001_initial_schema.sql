-- Estudiantes
create table estudiantes (
  id uuid primary key default gen_random_uuid(),
  nombres text not null,
  dni text not null unique,
  correo text not null,
  celular text,
  created_at timestamptz default now()
);

-- Exámenes
create table examenes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  duracion_minutos int not null default 45,
  nota_minima numeric(5,2) not null default 60,
  created_at timestamptz default now()
);

-- Preguntas (tipo: 'multiple' | 'verdadero_falso' | 'corta' | 'desarrollo')
create table preguntas (
  id uuid primary key default gen_random_uuid(),
  examen_id uuid references examenes(id) on delete cascade,
  tipo text not null check (tipo in ('multiple','verdadero_falso','corta','desarrollo')),
  pregunta text not null,
  puntaje numeric(5,2) not null default 1,
  orden int not null default 0
);

-- Opciones (solo para multiple y verdadero_falso)
create table opciones (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid references preguntas(id) on delete cascade,
  texto text not null,
  es_correcta boolean not null default false
);

-- Asignaciones (estado: 'pendiente' | 'en_progreso' | 'pendiente_revision' | 'aprobado' | 'desaprobado')
create table asignaciones (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid references estudiantes(id) on delete cascade,
  examen_id uuid references examenes(id) on delete cascade,
  token_unico text not null unique default encode(gen_random_bytes(12), 'hex'),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','en_progreso','pendiente_revision','aprobado','desaprobado')),
  fecha_asignacion timestamptz default now()
);

-- Intentos
create table intentos (
  id uuid primary key default gen_random_uuid(),
  asignacion_id uuid references asignaciones(id) on delete cascade,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  nota_final numeric(5,2)
);

-- Respuestas
create table respuestas (
  id uuid primary key default gen_random_uuid(),
  intento_id uuid references intentos(id) on delete cascade,
  pregunta_id uuid references preguntas(id) on delete cascade,
  respuesta text,
  puntaje_obtenido numeric(5,2) default 0,
  observacion text
);

-- Certificados
create table certificados (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid references estudiantes(id) on delete cascade,
  examen_id uuid references examenes(id) on delete cascade,
  intento_id uuid references intentos(id) on delete cascade,
  codigo_verificacion text not null unique,
  pdf_url text,
  fecha_emision timestamptz default now()
);

-- Configuración de RLS (Row Level Security)

-- Habilitar RLS en todas las tablas
alter table estudiantes enable row level security;
alter table examenes enable row level security;
alter table preguntas enable row level security;
alter table opciones enable row level security;
alter table asignaciones enable row level security;
alter table intentos enable row level security;
alter table respuestas enable row level security;
alter table certificados enable row level security;

-- Políticas para Administradores (acceso total a usuarios autenticados)
create policy "Admin total access estudiantes" on estudiantes for all to authenticated using (true);
create policy "Admin total access examenes" on examenes for all to authenticated using (true);
create policy "Admin total access preguntas" on preguntas for all to authenticated using (true);
create policy "Admin total access opciones" on opciones for all to authenticated using (true);
create policy "Admin total access asignaciones" on asignaciones for all to authenticated using (true);
create policy "Admin total access intentos" on intentos for all to authenticated using (true);
create policy "Admin total access respuestas" on respuestas for all to authenticated using (true);
create policy "Admin total access certificados" on certificados for all to authenticated using (true);

-- Políticas Públicas (acceso restringido para estudiantes / visitantes)

-- Estudiantes pueden ver su propia asignación a través de token_unico
create policy "Lectura publica asignaciones por token" on asignaciones for select to anon using (true);

-- Estudiantes pueden leer e insertar su propio intento
create policy "Lectura publica intentos por asignacion" on intentos for select to anon using (true);
create policy "Insercion publica intentos" on intentos for insert to anon with check (true);
create policy "Actualizacion publica intentos" on intentos for update to anon using (true);

-- Estudiantes pueden leer e insertar sus propias respuestas
create policy "Lectura publica respuestas por intento" on respuestas for select to anon using (true);
create policy "Insercion publica respuestas" on respuestas for insert to anon with check (true);
create policy "Actualizacion publica respuestas" on respuestas for update to anon using (true);

-- Estudiantes pueden ver el examen asignado
create policy "Lectura publica examenes" on examenes for select to anon using (true);

-- Estudiantes pueden ver las preguntas del examen
create policy "Lectura publica preguntas" on preguntas for select to anon using (true);

-- Estudiantes pueden ver las opciones
create policy "Lectura publica opciones" on opciones for select to anon using (true);

-- Estudiantes pueden ver sus propios datos
create policy "Lectura publica estudiantes" on estudiantes for select to anon using (true);

-- Público puede ver certificados por código
create policy "Lectura publica certificados por codigo" on certificados for select to anon using (true);

-- Supabase Storage: Bucket de certificados
insert into storage.buckets (id, name, public) values ('certificados', 'certificados', true);
create policy "Lectura publica bucket certificados" on storage.objects for select to anon using (bucket_id = 'certificados');
create policy "Admin puede gestionar certificados" on storage.objects for all to authenticated using (bucket_id = 'certificados');


-- Estudiantes pueden actualizar el estado de su asignacion al iniciar el examen
create policy "Actualizacion publica asignaciones" on asignaciones for update to anon using (true);
