# Nuvio

> Plataforma web de inteligencia artificial para comprender información médica compleja en lenguaje claro.

## Descripción

**Nuvio** es una plataforma web que busca eliminar la barrera del vocabulario médico.

El usuario puede subir documentos médicos, como análisis de sangre, resonancias, tomografías, epicrisis, electrocardiogramas y otros estudios, para que la inteligencia artificial los analice y transforme su contenido técnico en una explicación clara, estructurada y fácil de comprender.

El objetivo no es reemplazar al médico ni realizar diagnósticos, sino ayudar al usuario a comprender mejor la información que aparece en sus propios estudios y llegar a una consulta médica con mayor contexto y mejores preguntas.

### Propuesta de valor

> **Nuvio convierte información médica compleja en información que las personas pueden entender.**

La plataforma debe ayudar a responder preguntas como:

* ¿Qué significa este valor?
* ¿Está dentro del rango esperado?
* ¿Qué valores aparecen fuera de rango?
* ¿Qué significa el resultado en términos simples?
* ¿Qué debería preguntarle a mi médico?
* ¿Hay información del documento que debería prestar especial atención?

---

# Objetivos del proyecto

Nuvio se está desarrollando completamente desde cero como una nueva versión conceptual y técnica de un proyecto anterior.

No se debe reutilizar arquitectura, código, componentes ni decisiones de diseño del proyecto anterior salvo que exista una razón técnica clara para hacerlo.

Los objetivos principales son:

1. Crear una experiencia de usuario extremadamente simple.
2. Permitir subir documentos médicos de forma intuitiva.
3. Extraer y procesar correctamente el contenido de los documentos.
4. Utilizar IA para explicar la información médica en lenguaje comprensible.
5. Separar claramente información, interpretación y advertencias.
6. Mantener una interfaz moderna, limpia y profesional.
7. Priorizar accesibilidad, responsive design y rendimiento.
8. Construir una arquitectura escalable y mantenible.
9. Mantener límites claros entre información educativa y diagnóstico médico.

---

# Stack tecnológico

El proyecto utiliza inicialmente:

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **ESLint**
* **pnpm**
* **App Router**
* **src directory**
* **Path alias:** `@/*`

El proyecto fue creado mediante:

```bash
pnpm dlx create-next-app@latest nuvio-v0.0.1 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Ubicación local del proyecto:

```text
C:\Users\Usuario\Desktop\Proyectos\nuvio\nuvio-v0.0.1
```

---

# Estado actual

El proyecto se encuentra en una etapa inicial de desarrollo.

La aplicación base de Next.js ya fue creada, pero Nuvio todavía debe construirse desde cero.

No asumir que existen componentes, sistemas de diseño, APIs, autenticación, base de datos o funcionalidades médicas implementadas.

Antes de introducir dependencias nuevas, evaluar si realmente son necesarias.

---

# Dirección de diseño

Nuvio debe sentirse como un **producto tecnológico moderno enfocado en salud**, no como una clínica tradicional.

La interfaz debe transmitir:

* claridad
* confianza
* precisión
* simplicidad
* tecnología
* inteligencia artificial
* seguridad

Evitar diseños médicos genéricos.

No utilizar como recurso visual principal:

* cruces médicas
* estetoscopios
* hospitales
* pastillas
* corazones médicos
* doctores
* cerebros genéricos asociados a IA

La identidad visual debe construirse alrededor del concepto de **transformar información médica compleja en claridad**.

La interfaz debe ser:

* minimalista
* moderna
* limpia
* profesional
* accesible
* responsive
* visualmente consistente

Evitar interfaces sobrecargadas, gradientes excesivos, glassmorphism exagerado, sombras innecesarias y componentes visuales sin propósito.

---

# Principios de UX

La experiencia principal debe poder entenderse sin instrucciones.

El flujo conceptual principal es:

```text
Usuario
  ↓
Sube documento médico
  ↓
Nuvio procesa el documento
  ↓
IA analiza la información
  ↓
Nuvio organiza los resultados
  ↓
Usuario recibe una explicación clara
```

La información debe presentarse progresivamente.

No mostrar grandes bloques de texto médico.

Priorizar:

* títulos claros
* tarjetas informativas
* valores importantes
* estados visuales
* explicaciones breves
* lenguaje natural
* preguntas sugeridas para el médico

---

# Seguridad y responsabilidad médica

Nuvio es una herramienta de **interpretación y educación**, no un sistema de diagnóstico.

La aplicación nunca debe presentar una interpretación de IA como un diagnóstico médico confirmado.

La comunicación debe evitar afirmaciones absolutas como:

* "Tenés esta enfermedad."
* "Esto significa que tenés X."
* "No tenés ningún problema."
* "No necesitás consultar a un médico."

Preferir expresiones como:

* "Este resultado puede estar relacionado con..."
* "Este valor aparece fuera del rango indicado en el documento."
* "Conviene consultar este resultado con un profesional."
* "La IA no puede confirmar un diagnóstico."
* "El significado clínico depende del contexto y debe ser evaluado por un profesional."

Cuando exista información insuficiente, la aplicación debe reconocer esa limitación en lugar de inventar información.

---

# Reglas de desarrollo

OpenCode debe trabajar como un desarrollador senior de software.

Antes de implementar una funcionalidad:

1. Comprender la arquitectura existente.
2. Revisar los archivos relacionados.
3. Identificar dependencias entre componentes.
4. Evitar modificar archivos que no sean necesarios.
5. Mantener la implementación simple y mantenible.

El código debe ser:

* TypeScript estricto
* mantenible
* modular
* reutilizable
* legible
* correctamente tipado
* preparado para producción

Evitar:

* `any` salvo casos realmente justificados
* código duplicado
* componentes gigantes
* lógica de negocio dentro de componentes visuales
* nombres ambiguos
* estados innecesarios
* dependencias innecesarias
* soluciones temporales que puedan convertirse en deuda técnica

---

# Arquitectura

Mantener una separación clara entre:

* UI
* componentes reutilizables
* lógica de negocio
* servicios
* procesamiento de documentos
* integración con IA
* validación
* manejo de errores

Cuando una funcionalidad pueda aislarse correctamente, crear módulos independientes en lugar de concentrar toda la lógica en una única página.

Priorizar Server Components de Next.js cuando sea apropiado.

Utilizar Client Components únicamente cuando sean necesarios por interactividad, estado del cliente, APIs del navegador o librerías que los requieran.

---

# Manejo de errores

Todas las funcionalidades que involucren datos externos, archivos, APIs o IA deben contemplar errores.

Como mínimo considerar:

* archivo inválido
* formato no soportado
* archivo demasiado grande
* documento vacío
* extracción de texto fallida
* API no disponible
* timeout
* respuesta inválida de IA
* errores inesperados
* falta de información suficiente

Los errores mostrados al usuario deben ser comprensibles y accionables.

No mostrar stack traces ni errores internos.

---

# Accesibilidad

La accesibilidad debe considerarse desde el comienzo.

Utilizar HTML semántico y controles accesibles.

Considerar:

* navegación mediante teclado
* labels apropiados
* contraste suficiente
* estados de focus
* mensajes de error accesibles
* `aria-*` únicamente cuando sean necesarios
* textos alternativos para imágenes
* botones y controles con nombres claros

No utilizar elementos visuales como sustitutos de información textual importante.

---

# Responsive Design

Nuvio debe funcionar correctamente en:

* teléfonos
* tablets
* notebooks
* monitores de escritorio

El diseño debe partir de una experiencia mobile-first cuando sea conveniente.

No solucionar problemas responsive agregando hacks o valores arbitrarios sin entender la causa.

---

# IA

La integración con inteligencia artificial debe diseñarse como una capa independiente.

No acoplar toda la aplicación directamente a un proveedor específico.

La arquitectura debería permitir cambiar el proveedor o modelo posteriormente sin tener que reconstruir toda la aplicación.

Las respuestas de la IA deben tener una estructura controlada y validable.

No confiar ciegamente en texto libre cuando la aplicación necesite datos estructurados.

Validar las respuestas antes de mostrarlas al usuario.

---

# Documentos médicos

Los documentos son información potencialmente sensible.

El sistema debe minimizar la exposición innecesaria de información personal.

Siempre que sea posible:

* validar archivos antes de procesarlos
* limitar tamaños
* validar MIME type y extensión
* evitar almacenar información innecesariamente
* no registrar contenido médico en logs
* no exponer documentos mediante URLs públicas
* manejar correctamente errores de procesamiento
* separar datos temporales de datos persistentes

La privacidad debe considerarse parte fundamental de la arquitectura, no una funcionalidad posterior.

---

# Git

Realizar cambios pequeños y coherentes aca te dejo el link para que subas todos los cambios del proyecto a mi github. https://github.com/federicobordon09-dev/nuvio.git

Los commits deben representar cambios lógicos.

Evitar commits que mezclen:

* refactors
* nuevas funcionalidades
* cambios visuales
* modificaciones de configuración

sin una razón clara.

No eliminar ni modificar archivos existentes sin comprobar primero su propósito.

---

# Dependencias

Antes de instalar una nueva dependencia, evaluar:

1. Si realmente es necesaria.
2. Si Next.js, React o las APIs existentes ya resuelven el problema.
3. El mantenimiento del paquete.
4. Su impacto en bundle/performance.
5. Su compatibilidad con el proyecto.

No instalar librerías simplemente por conveniencia.

---

# Regla fundamental para OpenCode

**No implementar por implementar.**

Antes de realizar cambios importantes, analizar el problema y la arquitectura existente.

Si una decisión técnica tiene varias alternativas razonables, elegir la que tenga mejor equilibrio entre:

* simplicidad
* mantenibilidad
* seguridad
* rendimiento
* escalabilidad

Cuando se encuentre un problema existente, identificar primero:

**Causa raíz → Solución → Prevención**

No aplicar parches que oculten el problema original.

---

# Filosofía del proyecto

Nuvio debe ser una aplicación que reduzca la complejidad, no que la traslade al usuario.

Cada decisión de producto y desarrollo debe responder a una pregunta:

> **¿Esto hace que Nuvio sea más claro, seguro y útil para una persona que intenta entender su información médica?**

Si una funcionalidad agrega complejidad sin aportar valor significativo, reconsiderarla.

---

## Comando de desarrollo

Para iniciar el proyecto:

```bash
pnpm dev
```

Por defecto, la aplicación estará disponible en:

```text
http://localhost:3000
```

## Estructura inicial

La estructura debe evolucionar a medida que el proyecto crezca, manteniendo una separación clara de responsabilidades.

No crear carpetas o abstracciones innecesarias antes de que exista una necesidad real.

---

## Nuvio

**Información médica compleja. Explicada de forma clara.**
