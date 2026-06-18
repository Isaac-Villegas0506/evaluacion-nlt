-- Agregar columna imagen_url a preguntas
ALTER TABLE public.preguntas ADD COLUMN imagen_url text;

-- Crear bucket de almacenamiento para las imágenes de los exámenes si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam_images', 'exam_images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear política de seguridad para lectura pública
CREATE POLICY "Imagenes publicas" ON storage.objects
FOR SELECT USING (bucket_id = 'exam_images');

-- Crear política de seguridad para inserción 
CREATE POLICY "Imagenes insertables" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'exam_images');
