# Casos de Uso — DataVision

## Actores

| Actor | Descripción |
|---|---|
| **Analista** | Usuario principal del dashboard; realiza consultas y monitoriza en tiempo real |
| **Administrador** | Configura dominios, fuentes de vídeo y sesiones |
| **Motor de Visión** | Sistema interno que publica detecciones y eventos |
| **Asistente IA** | Sistema interno (Claude API) que responde consultas en lenguaje natural |

---

## CU-01: Iniciar sesión de análisis

**Actor**: Administrador  
**Precondición**: Existe al menos un dominio y una fuente de vídeo configurada  
**Flujo principal**:
1. El administrador selecciona dominio y fuente de vídeo
2. El sistema inicia el motor de visión con la configuración del dominio
3. El motor comienza a procesar frames y publicar detecciones
4. El dashboard muestra el feed en tiempo real

**Postcondición**: Sesión activa, datos fluyendo al dashboard

---

## CU-02: Monitorizar objetos en tiempo real

**Actor**: Analista  
**Precondición**: Existe una sesión activa  
**Flujo principal**:
1. El analista abre el dashboard de la sesión activa
2. El frontend establece conexión WebSocket
3. El dashboard muestra posiciones actualizadas de objetos en el mapa
4. Los contadores y gráficas se actualizan en tiempo real
5. Los eventos de dominio aparecen en el feed lateral

**Flujos alternativos**:
- Si se pierde la conexión WebSocket, el frontend reintenta automáticamente

---

## CU-03: Consultar información mediante chat IA

**Actor**: Analista  
**Precondición**: Existe una sesión activa o histórica  
**Flujo principal**:
1. El analista escribe una pregunta en lenguaje natural en el chat
2. El frontend envía la consulta al backend con contexto de la sesión
3. El backend construye el prompt con las tools disponibles y llama a Claude API
4. Claude determina qué tools invocar y el backend ejecuta las queries
5. Claude genera la respuesta con los datos obtenidos
6. El frontend muestra la respuesta en streaming (carácter a carácter)
7. Si la respuesta implica una acción UI, el dashboard la ejecuta (highlight, actualización de gráfica)

**Ejemplos de consultas**:
- "¿Cuántos vehículos han entrado por la entrada norte en la última hora?" → respuesta + highlight en mapa
- "¿Hay congestión en algún acceso ahora mismo?" → respuesta + resaltado del acceso afectado
- "Muéstrame la evolución del número de jugadores en el área local en los últimos 10 minutos" → respuesta + gráfica temporal
- "¿Cuántos goles se han marcado en la segunda parte?" → respuesta de conteo

---

## CU-04: Ver historial de posiciones de un objeto

**Actor**: Analista  
**Precondición**: El objeto existe en la base de datos  
**Flujo principal**:
1. El analista selecciona un objeto en el mapa o lo busca por ID
2. El sistema muestra el panel de detalle del objeto
3. El analista selecciona un rango temporal
4. El sistema carga el historial de posiciones
5. El mapa muestra la trayectoria del objeto con línea de traza

---

## CU-05: Ver estadísticas de zona

**Actor**: Analista  
**Precondición**: Existe sesión activa o histórica  
**Flujo principal**:
1. El analista selecciona una zona en el mapa o en el panel de zonas
2. El sistema muestra: conteo actual, histórico de ocupación, eventos registrados
3. El analista puede ajustar el rango temporal con el selector de fechas
4. Las gráficas se actualizan con los nuevos parámetros

---

## CU-06: Cambiar de dominio

**Actor**: Administrador  
**Precondición**: Ninguna sesión activa (o el administrador la finaliza antes)  
**Flujo principal**:
1. El administrador accede a la configuración
2. Selecciona un nuevo dominio (ej: de Tráfico a Fútbol)
3. El sistema carga la configuración del nuevo dominio:
   - Clases de objetos a detectar
   - Layout del mapa/campo
   - Zonas disponibles
   - Métricas del dashboard
   - Tools disponibles para el chat IA
4. El administrador selecciona la fuente de vídeo y lanza la sesión

---

## CU-07: Exportar informe de sesión

**Actor**: Analista  
**Precondición**: Existe al menos una sesión finalizada  
**Flujo principal**:
1. El analista selecciona una sesión del historial
2. Elige el tipo de informe (resumen, detalle, eventos)
3. El sistema genera el informe con estadísticas, gráficas y eventos clave
4. El analista descarga el informe en PDF o CSV

---

## CU-08: Configurar fuente de vídeo

**Actor**: Administrador  
**Flujo principal**:
1. El administrador accede a "Fuentes de vídeo"
2. Añade una nueva fuente indicando nombre, tipo y URL
3. El sistema valida que la fuente es accesible
4. La fuente queda disponible para nuevas sesiones

**Tipos de fuente soportados**:
- Cámara IP (RTSP)
- Archivo de vídeo local (MP4, AVI)
- Stream HTTP
