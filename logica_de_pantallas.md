# Lógica Estructural de la Aplicación (Sin Diseño)

Este documento describe exclusivamente la **lógica de negocio, estados, acciones, modales y datos requeridos** en cada página de la aplicación. Está optimizado para que otra Inteligencia Artificial o equipo de frontend pueda encargarse del diseño y la maquetación.

---

## 1. Módulo de Autenticación (Login)
**Ruta:** `/login`
*   **Estado / Datos Requeridos:**
    *   `correo` (string)
    *   `password` (string)
*   **Acciones:**
    *   **"Iniciar Sesión":** Valida las credenciales contra el servicio de autenticación (ej. Supabase Auth). Si es exitoso, redirige a `/dashboard`. Si falla, muestra un mensaje de error.

---

## 2. Panel de Administración (Admin Layout)
**Ruta:** Envuelve todas las subrutas de `/admin/...`
*   **Elementos Fijos:**
    *   **Barra Lateral (Sidebar) / Navegación:** Contiene los enlaces a las pestañas: Dashboard, Solicitantes, Exámenes, Solicitudes, Certificados.
    *   **Acciones:** Botón "Cerrar Sesión" que destruye la sesión y redirige a `/login`.

### 2.1. Pestaña: Dashboard
**Ruta:** `/dashboard`
*   **Lógica:** Carga al montar la vista y obtiene estadísticas globales de la base de datos (Total de exámenes asignados, aprobados, pendientes, etc.) para renderizarlos.

### 2.2. Pestaña: Solicitantes
**Ruta:** `/solicitantes`
*   **Datos Principales:** Lista de solicitantes obtenidos de la BD (`nombres`, `dni`, `correo`, `celular`).
*   **Estados de Filtro:**
    *   Buscador de texto: Filtra la lista en tiempo real por DNI o Nombres.
*   **Acciones en Tabla:**
    *   **"Editar":** Abre el Modal de Edición pasando el objeto del solicitante seleccionado.
    *   **"Eliminar":** Solicita confirmación y, de aceptarse, borra al solicitante y su historial de la BD.
*   **Modal: "Nuevo / Editar Solicitante"**
    *   **Campos de Formulario:** Nombres (Requerido), DNI (Requerido), Correo Electrónico (Requerido), Celular (Opcional).
    *   **Botones:** Cancelar, Guardar.
    *   **Lógica de Guardado:** Si existe un ID en edición, actualiza (`UPDATE`); si no, inserta (`INSERT`).

### 2.3. Pestaña: Exámenes
**Ruta:** `/examenes`
*   **Datos Principales:** Lista de exámenes (`nombre`, `descripcion`, `duracion_minutos`, `nota_minima`, `cantidad_preguntas`).
*   **Estados de Filtro:**
    *   Buscador de texto: Filtra en tiempo real por el nombre del examen.
*   **Acciones en Tabla:**
    *   **"Gestionar Preguntas":** Redirige a `/examenes/[id]` para editar las preguntas de ese examen.
    *   **"Editar":** Abre el Modal de Edición.
    *   **"Eliminar":** Solicita confirmación y borra el examen (y sus preguntas asociadas) de la BD.
*   **Modal: "Nuevo / Editar Examen"**
    *   **Campos de Formulario:** Nombre del Examen (Req), Descripción (Opc), Duración en minutos (Req), Nota Mínima Aprobatoria (Req).
    *   **Botones:** Cancelar, Guardar.

### 2.4. Pestaña: Solicitudes (Asignaciones)
**Ruta:** `/asignaciones`
*   **Datos Principales:** Lista de asignaciones generadas. Incluye relación con el solicitante (nombre, dni), examen (nombre), estado de la evaluación y token único.
*   **Estados de Filtro:**
    *   Buscador de texto: Filtra por DNI, Nombres o Nombre del Examen.
*   **Acciones en Tabla:**
    *   **"Ver Detalles":** Abre el Modal de "Detalles de Solicitud".
    *   **"Eliminar":** Solicita confirmación y borra la solicitud de la BD.
    *   **"Revisar":** (Aparece solo si el estado es `pendiente_revision`). Redirige a calificar manualmente las preguntas de desarrollo.
*   **Modal: "Nueva Solicitud"**
    *   **Campos:**
        *   `DNI`: Input numérico (max 8 dígitos). Lógica especial: al detectar 8 caracteres, invoca una API externa (RENIEC/PeruDevs) automáticamente.
        *   `Nombres`: Se rellena automáticamente si el DNI es encontrado; sino, se ingresa o avisa de error.
        *   `Celular` (Opcional).
        *   `Correo` (Opcional, en BD usa un fallback si está vacío).
        *   `Examen`: Select desplegable con la lista de exámenes disponibles.
    *   **Botones:** Cancelar, Generar Solicitud.
    *   **Lógica de Guardado:** Verifica si el solicitante existe por DNI; si no, lo registra. Luego asocia el solicitante con el examen creando un "Token único". Cierra este modal y abre el "Modal de Éxito".
*   **Modal: "Éxito de Solicitud"**
    *   **Lógica:** Se muestra inmediatamente después de generar la solicitud.
    *   **Acciones:**
        *   "Copiar Enlace": Copia la URL pública del examen al portapapeles.
        *   "Enviar por WhatsApp": Extrae el celular ingresado, formatea el texto y abre una pestaña hacia la API web de WhatsApp (`wa.me`) con el link adjunto.
*   **Modal: "Detalles de Solicitud"**
    *   **Lógica:** Es un visualizador de solo lectura (DNI, Estado, Nombres, Celular, Correo, Examen asignado, Fecha de asignación).
    *   **Acciones:** Botón para copiar el enlace directo del examen.

---

## 3. Plataforma del Solicitante (Interfaz Pública)

### 3.1. Landing / Verificación Pre-Examen
**Ruta:** `/examen/[token]`
*   **Datos Principales:** A través del token de la URL, consulta en BD el examen y su estado.
*   **Lógica:**
    *   Si el enlace no es válido o ya fue completado, muestra un error.
    *   Si está habilitado, muestra: Nombre del Examen, Duración, e instrucciones.
    *   Requiere que el usuario introduzca su DNI para validar que la persona que entra es la que fue registrada en la Solicitud.
*   **Acción:** "Iniciar Examen" (registra la fecha de inicio en BD y redirige a la vista de resolución).

### 3.2. Resolución del Examen
**Ruta:** `/examen/[token]/resolver`
*   **Lógica de Temporizador:** Un cronómetro cuenta regresivamente basado en la duración asignada en la BD. Si llega a 0, fuerza la acción de "Finalizar Examen".
*   **Estados de Guardado (Auto-save):** Cuando un solicitante selecciona una opción o escribe texto, se lanza una petición de actualización (`upsert`) a la BD. Existen estados visuales para "Guardando..." y "Guardado".
*   **Secciones Estructurales:**
    *   **Cabecera:** Muestra Nombre del Examen, Temporizador y Botón "Finalizar Examen".
    *   **Barra Lateral de Navegación:** Matriz de botones numéricos (1, 2, 3...) equivalente al número de preguntas. Al hacer clic, cambia la "pregunta actual". Debe reflejar visualmente cuáles preguntas ya fueron respondidas.
    *   **Área de Pregunta Activa:**
        *   Muestra el enunciado de la pregunta correspondiente al índice actual.
        *   Renderiza la interacción según el tipo de pregunta:
            *   *Múltiple / Verdadero-Falso:* Radio buttons.
            *   *Desarrollo / Corta:* Textarea.
    *   **Navegación Inferior:** Botones "Anterior" y "Siguiente". Si es la última pregunta, el botón "Siguiente" se reemplaza por "Finalizar".
*   **Lógica de Finalización ("Finalizar Examen"):**
    *   Verifica si hay preguntas de tipo "Desarrollo".
    *   Calcula el puntaje de preguntas automáticas (Verdadero/Falso, Múltiple).
    *   Si el examen es 100% automático, evalúa si el puntaje supera la "Nota mínima" y actualiza la asignación a `aprobado` o `desaprobado` e inserta el certificado si corresponde.
    *   Si hay preguntas de desarrollo, pone la asignación en estado `pendiente_revision`.
    *   Redirige fuera de la pantalla de resolución (de vuelta al landing o mensaje de gracias).

---

## 4. Módulo Público de Certificados
**Ruta:** `/verificar/[codigo]`
*   **Lógica:** Lee el código de la URL, consulta a la base de datos si existe el certificado válido asociado a ese código.
*   **Renderizado:** 
    *   Si no existe: Mensaje de "Certificado inválido".
    *   Si existe: Muestra el Nombre del solicitante, Nombre del Examen, Fecha de Aprobación, y un enlace o botón para descargar el PDF.
