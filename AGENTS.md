# AGENTS.md

## Proyecto

Este repositorio contiene el sitio web estático de Insight & Forward, publicado desde GitHub Pages.

Insight & Forward es una firma orientada a servicios legales, comercio exterior, migración, consultoría, capacitación, trámites y representación legal. El sitio debe comunicar experiencia técnica, criterio estratégico y confianza profesional, evitando un tono genérico o excesivamente publicitario.

## Contexto Estratégico

El sitio web funciona como canal principal de presencia digital, posicionamiento experto y generación de confianza para clientes actuales y potenciales.

Cada cambio debe contribuir a alguno de estos objetivos:

- Explicar con claridad qué hace Insight & Forward y para quién.
- Reforzar autoridad en temas legales, comercio exterior, migración, cumplimiento, trámites y consultoría.
- Facilitar que una persona interesada entienda los servicios y pueda contactar a la firma.
- Mantener una imagen sobria, actual, confiable y técnicamente sólida.
- Mejorar la visibilidad orgánica del sitio en buscadores.
- Convertir publicaciones, análisis y contenido editorial en activos de reputación profesional.

## Audiencia Objetivo

El sitio debe hablar principalmente a:

- Empresas que necesitan asesoría en comercio exterior, cumplimiento, trámites, consultoría o representación.
- Personas físicas o familias que requieren apoyo migratorio o legal.
- Directivos, áreas jurídicas, áreas de cumplimiento, operaciones, comercio exterior, recursos humanos y administración.
- Clientes que valoran precisión técnica, respuesta clara y acompañamiento confiable.
- Aliados profesionales que buscan validar la experiencia de la firma.

La comunicación debe ser clara para personas no especialistas, pero suficientemente rigurosa para lectores técnicos o jurídicos.

## Estructura Principal

- `index.html`: página principal del sitio.
- `shared.css`: estilos globales compartidos.
- `shared.js`: comportamiento JavaScript compartido.
- `publicaciones.html`: índice de publicaciones.
- `publicaciones/`: artículos individuales.
- `data/publicaciones.json`: metadatos de publicaciones.
- `blog.html`: página de blog o contenido editorial.
- `pulso-legal.html`: página de Pulso Legal.
- `data/pulso-legal.json`: datos de Pulso Legal.
- `scripts/update-pulso-legal.mjs`: script de actualización de Pulso Legal.
- `sitemap.xml`, `robots.txt` y `CNAME`: archivos de publicación, SEO y GitHub Pages.
- Páginas de servicios: `comercio-exterior.html`, `migratorio.html`, `civil.html`, `consultoria.html`, `capacitacion.html`, `tramites.html`, `representacion-legal.html`.

## Reglas Técnicas

- Mantener el sitio como HTML, CSS y JavaScript estático, salvo instrucción expresa en contrario.
- Mantener compatibilidad con GitHub Pages.
- Evitar dependencias, frameworks o procesos de build innecesarios.
- Reutilizar `shared.css` y `shared.js` para cambios globales antes de duplicar estilos o lógica en páginas individuales.
- Mantener consistencia de navegación, encabezado, pie de página, tipografía, espaciado, botones, tarjetas y componentes comunes.
- No introducir cambios visuales amplios sin revisar primero los patrones existentes en `index.html`, `shared.css` y `shared.js`.
- No eliminar imágenes, publicaciones, datos, scripts o archivos de publicación sin confirmación explícita.
- Mantener rutas relativas limpias y compatibles con despliegue estático.
- Verificar visualmente cambios importantes en páginas HTML cuando sea posible.

## SEO

Cada página pública debe cuidar SEO básico y claridad semántica:

- Usar un `title` específico, natural y alineado con la intención de búsqueda.
- Incluir una `meta description` clara, no genérica y orientada al valor de la página.
- Mantener una sola etiqueta `h1` por página.
- Usar encabezados `h2` y `h3` con estructura lógica.
- Usar URLs, títulos y textos internos descriptivos.
- Priorizar enlaces internos hacia servicios, publicaciones y páginas de contacto relevantes.
- Evitar contenido duplicado innecesario entre páginas.
- Si se agregan páginas públicas nuevas, revisar si deben añadirse a `sitemap.xml`.
- Si se crean o modifican publicaciones, actualizar `data/publicaciones.json` cuando corresponda.
- Cuidar textos alternativos de imágenes cuando sean relevantes para comprensión o SEO.
- Mantener `robots.txt`, `sitemap.xml` y `CNAME` coherentes con el despliegue del sitio.

## Reglas Editoriales

El contenido debe estar en español formal, claro y profesional.

Tono recomendado:

- Sobrio.
- Confiable.
- Estratégico.
- Técnico cuando sea necesario.
- Comprensible para personas no especialistas.
- Directo, sin exageraciones comerciales.

Evitar:

- Frases genéricas de marketing como "soluciones integrales de clase mundial" si no agregan información concreta.
- Promesas absolutas o garantías de resultado.
- Lenguaje alarmista.
- Exceso de tecnicismos sin explicación.
- Repetición innecesaria de palabras clave.
- Claims legales, migratorios o comerciales que puedan interpretarse como garantía.

Preferir:

- Explicaciones concretas de problemas, procesos y beneficios.
- Mensajes que conecten cumplimiento, prevención de riesgos y toma de decisiones.
- Frases orientadas a confianza, criterio, acompañamiento y claridad.
- Contenido que demuestre conocimiento mediante precisión, no mediante grandilocuencia.

## Objetivos de Negocio

Los cambios en el sitio deben apoyar estos objetivos:

- Generar contactos calificados.
- Aumentar confianza en la firma antes de una llamada o reunión.
- Posicionar a Insight & Forward como referente en comercio exterior, migración, cumplimiento y consultoría.
- Hacer visibles los servicios prioritarios.
- Convertir publicaciones y Pulso Legal en activos de atracción orgánica.
- Facilitar la navegación desde contenido editorial hacia servicios relacionados.
- Reducir fricción para contactar a la firma.
- Mantener una presencia digital consistente con una firma profesional y especializada.

## Publicaciones y Pulso Legal

Al trabajar con publicaciones:

- Mantener títulos claros, específicos y útiles.
- Usar introducciones que expliquen rápidamente el problema o contexto.
- Desarrollar el contenido con estructura escaneable.
- Incluir enlaces internos cuando exista una relación natural con servicios o publicaciones relacionadas.
- Actualizar `data/publicaciones.json` si se agrega, renombra o modifica una publicación indexada.
- Mantener coherencia visual con `publicaciones/articulo.css`.

### Publicaciones Bilingües Futuras

A partir de este criterio, toda nueva publicación incorporada al sitio debe prepararse y publicarse en dos versiones como parte del mismo proceso editorial e implementación:

- Una versión original en español.
- Una versión profesional localizada al inglés.

La versión en inglés debe publicarse como una página independiente equivalente dentro de la arquitectura bilingüe del sitio, vinculada funcionalmente a su versión en español. No debe tratarse como una traducción visible dentro de la misma página en español.

La versión en inglés no debe ser una traducción literal frase por frase. Debe leerse como un texto redactado originalmente en inglés para empresarios, inversionistas, importadores, exportadores, profesionales de compliance, asesores legales y tomadores de decisiones de habla inglesa, especialmente de Estados Unidos, Canadá y otros mercados internacionales.

Al redactar la versión en inglés:

- Utilizar terminología natural de international trade, customs, tax, compliance, immigration y regulatory matters.
- Mantener íntegro el contenido jurídico y técnico de la publicación original.
- No simplificar conceptos legales.
- No eliminar referencias normativas.
- No agregar opiniones nuevas.
- Mantener la misma estructura editorial, jerarquía visual, formato de lectura y experiencia de usuario existentes.
- Asegurar que el contexto jurídico y territorial mexicano quede claramente identificado desde el título, introducción y primeros párrafos cuando sea relevante.
- No asumir que el lector conoce el sistema legal mexicano.
- Utilizar de forma natural expresiones como `Mexico’s customs framework`, `Mexican tax rules`, `Mexico’s Tax Administration Service (SAT)`, `Mexican customs authority (ANAM)`, `imports into Mexico`, `operations in Mexico` y `Mexican regulatory requirements` cuando correspondan.
- Optimizar naturalmente para búsquedas internacionales relacionadas con México, comercio exterior, aduanas, fiscalidad, cumplimiento regulatorio, migración y negocios en México, sin sacrificar calidad editorial ni fluidez.

Este criterio debe aplicarse automáticamente a todas las publicaciones futuras, sin requerir una instrucción adicional en cada solicitud.

Al trabajar con Pulso Legal:

- Mantener datos en `data/pulso-legal.json` cuando corresponda.
- Revisar `scripts/update-pulso-legal.mjs` antes de cambiar el flujo de actualización.
- Evitar romper el formato esperado por la página `pulso-legal.html`.

## Criterios de Calidad

Antes de terminar un cambio relevante:

- Revisar que no haya enlaces internos rotos evidentes.
- Confirmar que la navegación principal sigue funcionando.
- Confirmar que el sitio conserva coherencia visual en escritorio y móvil.
- Revisar ortografía, acentos y consistencia terminológica.
- Verificar que los cambios no rompen GitHub Pages.
- Mantener el repositorio limpio, sin archivos temporales o generados innecesarios.

## Prioridades de Implementación

Cuando haya varias formas de resolver algo:

1. Preferir cambios simples y mantenibles.
2. Respetar patrones existentes del sitio.
3. Mejorar claridad para el usuario final.
4. Cuidar SEO y estructura semántica.
5. Evitar dependencias nuevas.
6. Preservar compatibilidad con GitHub Pages.
