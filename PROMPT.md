# Implementa Website Promo

Construye la primera versión completa y pulida de **Website Promo**, una herramienta web para convertir una página real en una composición promocional animada, preparada para grabarse con un capturador de pantalla.

El usuario debe poder pegar la URL de una web, personalizar los colores y textos de la composición y reproducir una secuencia visual en formato 16:9. La herramienta prepara y reproduce la escena, pero no graba ni exporta vídeo.

## Contexto del proyecto

- El proyecto ya existe y utiliza Astro con TypeScript estricto.
- GSAP ya está instalado y debe utilizarse para la animación.
- Mantén una sola página Astro.
- No añadas React, Vue, Svelte, Tailwind ni otras dependencias.
- No añadas backend, base de datos, autenticación, cuentas de usuario ni analítica.
- Conserva los cambios existentes en `package.json` y `package-lock.json`.
- Sigue los patrones oficiales de Astro para [componentes](https://docs.astro.build/en/basics/astro-components/), [estilos](https://docs.astro.build/en/guides/styling/) y [scripts de cliente](https://docs.astro.build/en/guides/client-side-scripts/).

## Objetivo del producto

La página debe sentirse como una pequeña herramienta creativa, no como un formulario administrativo. Tendrá dos áreas visualmente diferenciadas:

1. Un editor claro con controles agrupados en tarjetas bento.
2. Una escena oscura, independiente y escalable, que sea la única zona visible al entrar en pantalla completa.

La versión inicial debe hacer muy bien una sola composición horizontal. No implementes formato vertical, edición mediante arrastre, redimensionado manual, varias plantillas ni exportación MP4.

## Dirección visual

### Editor

Diseña el editor con una estética **bento clara y editorial**:

- Fondo general marfil suave (`#F3F0E8`).
- Tarjetas blanco cálido (`#FFFEFA`).
- Texto principal casi negro (`#191918`).
- Texto secundario gris (`#6F6C64`).
- Bordes finos y discretos (`#DDD9CF`).
- Un único acento azul violeta (`#625BF6`) para acciones principales, foco y estados activos.
- Radios amplios, entre 20 y 28 píxeles.
- Sombras suaves, sin efectos de cristal ni brillos intensos.
- Tipografía sans serif contemporánea usando una pila del sistema; no dependas de fuentes remotas.
- Jerarquía editorial marcada: título grande, descripción breve y pequeñas etiquetas en mayúsculas para las tarjetas.

No apliques los colores que el usuario elija al editor. Esos colores afectan únicamente a la escena promocional.

### Distribución bento

Incluye un encabezado breve con el nombre **Website Promo** y una explicación de una línea. Debajo, organiza los controles en cuatro tarjetas:

- **Sitio web**: campo URL, botón «Cargar web» y estado de validación. Debe ser la tarjeta más ancha.
- **Apariencia**: color de fondo y color de texto, cada uno con selector visual y campo hexadecimal sincronizados.
- **Contenido**: título multilínea y marca opcional.
- **Reproducción**: acciones de animación, pantalla completa, modo sin animación y restablecimiento.

En escritorio usa una cuadrícula asimétrica de 12 columnas: la tarjeta de URL ocupa todo el ancho y las demás se reparten el espacio con diferentes proporciones. En tablet pasa a dos columnas. En móvil apila todas las tarjetas y haz que campos y botones sean cómodos de tocar.

### Escena promocional

La escena debe mantener un lienzo lógico de **1920 × 1080** y una relación 16:9:

- Fondo configurable, negro (`#121212`) por defecto.
- Marco de navegador minimalista a la izquierda, ocupando aproximadamente dos tercios del ancho.
- Tres puntos de navegador en rojo, amarillo y verde.
- `iframe` dentro del marco, con un tamaño de escritorio estable.
- Perspectiva e inclinación suaves, con sombra profunda pero discreta.
- Título grande a la derecha, con los saltos de línea introducidos por el usuario.
- Marca opcional en la esquina inferior derecha; si está vacía, no debe reservar espacio ni mostrarse.
- Márgenes de seguridad amplios para que ningún elemento se corte durante la animación.

La composición debe resultar legible y equilibrada con el título predeterminado «Website\nPromo». No incluyas indicadores de duración, barras rojas ni controles de vídeo dentro de la escena.

## Arquitectura recomendada

Organiza el código de forma sencilla y mantenible:

```text
src/
├── pages/
│   └── index.astro
├── components/
│   ├── Controls.astro
│   ├── RecordingStage.astro
│   └── BrowserFrame.astro
├── scripts/
│   ├── editor.ts
│   ├── animation.ts
│   └── stage.ts
└── styles/
    └── global.css
```

Los nombres pueden ajustarse únicamente si existe una razón técnica clara. Mantén las responsabilidades separadas:

- `Controls.astro`: formulario y tarjetas bento.
- `RecordingStage.astro`: lienzo, título, marca y cuenta atrás.
- `BrowserFrame.astro`: marco, estado vacío e `iframe`.
- `editor.ts`: estado, validación, eventos y persistencia.
- `animation.ts`: creación y control de una única timeline GSAP.
- `stage.ts`: escalado, `ResizeObserver`, pantalla completa y cursor.

Usa componentes `.astro` para el HTML generado y scripts TypeScript del lado del cliente para la interactividad. No introduzcas un framework de componentes.

## Estado y valores iniciales

Define y utiliza este contrato como fuente de verdad:

```ts
export interface PromoConfig {
  url: string;
  backgroundColor: string;
  textColor: string;
  title: string;
  brand: string;
  animationEnabled: boolean;
  countdownEnabled: boolean;
}
```

Valores iniciales:

```ts
const DEFAULT_CONFIG: PromoConfig = {
  url: '',
  backgroundColor: '#121212',
  textColor: '#FFFFFF',
  title: 'Website\nPromo',
  brand: 'Tu marca',
  animationEnabled: true,
  countdownEnabled: true,
};
```

Guarda la configuración con la clave `website-promo:config:v1` de `localStorage`. Persiste URL confirmada, colores, textos y preferencias, pero no el tiempo ni el estado de reproducción. Lee los datos de forma defensiva: si el JSON es inválido o alguna propiedad no tiene un valor aceptable, conserva el valor predeterminado correspondiente.

«Restablecer diseño» debe recuperar `DEFAULT_CONFIG`, actualizar todos los campos, vaciar la web cargada y devolver la animación al inicio.

## Carga de la web

- No actualices el `iframe` mientras el usuario escribe.
- Carga la dirección únicamente al enviar el formulario mediante «Cargar web» o Enter.
- Recorta espacios y añade `https://` si no se especificó un protocolo.
- Acepta solamente los protocolos `http:` y `https:` usando la API `URL`.
- Ante una dirección inválida, conserva la web cargada anteriormente y muestra un mensaje claro asociado al campo.
- Antes de cargar una URL, muestra dentro del navegador un estado vacío cuidado con una instrucción breve.
- La web debe poder recibir interacción, navegación y scroll normalmente.
- No intentes leer el contenido del `iframe`, controlar su scroll ni sincronizar su estado con la timeline.

Algunas páginas impiden su inclusión mediante `X-Frame-Options` o la directiva `frame-ancestors` de CSP. El navegador no ofrece una detección fiable y general de este bloqueo. No muestres un falso estado de éxito o error basado únicamente en el evento `load`. Añade fuera de la escena esta ayuda discreta:

> ¿No se muestra la web? Puede que esta dirección no permita su incrustación.

La ayuda nunca debe aparecer en pantalla completa.

## Edición en tiempo real

- Los selectores y campos hexadecimales deben permanecer sincronizados.
- Valida colores con el formato `#RRGGBB`; no apliques valores incompletos al lienzo.
- Los cambios válidos de color se reflejan inmediatamente en la escena.
- El título acepta saltos de línea y se actualiza al escribir.
- La marca se actualiza al escribir y desaparece cuando solo contiene espacios.
- Cambiar colores o textos nunca debe recargar el `iframe`.
- Centraliza los valores visuales dinámicos con variables CSS o atributos de datos, evitando estilos repetidos en línea.

## Escalado de la escena

El contenido interior mide lógicamente 1920 × 1080. Colócalo dentro de un contenedor adaptable y calcula una escala uniforme:

```text
scale = min(anchoDisponible / 1920, altoDisponible / 1080)
```

Usa `ResizeObserver` para recalcularla cuando cambie el tamaño del contenedor. El envoltorio exterior debe reservar el espacio visual correcto después de aplicar `transform: scale(...)`, sin barras de desplazamiento ni saltos de layout.

En la página normal, la escena se reduce para caber en el ancho disponible. En pantalla completa debe centrarse, usar el mayor tamaño 16:9 posible y rodearse de negro si la pantalla tiene otra proporción. El `iframe` debe conservar su viewport de escritorio aunque la herramienta se vea desde un móvil.

## Animación y reproducción

Crea exactamente una timeline GSAP reutilizable, pausada al iniciar. No crees timelines adicionales cada vez que se pulsa un botón.

La secuencia durará aproximadamente 10 segundos:

1. El navegador entra con desplazamiento corto, opacidad y una inclinación algo mayor.
2. El título aparece ligeramente después, con desplazamiento y desvanecimiento.
3. La marca entra de forma sutil.
4. El navegador realiza un acercamiento lento y reduce suavemente su inclinación.
5. La escena termina quieta durante unos segundos para facilitar la lectura.

Comportamiento de los controles:

- **Reproducir**: si la cuenta atrás está activa, muestra `3`, `2`, `1` sobre la escena y después reproduce desde la posición actual. Si la timeline ya terminó, comienza desde cero.
- **Pausar**: pausa la timeline y cancela una cuenta atrás en curso.
- **Reiniciar**: cancela la cuenta atrás, pausa la timeline y vuelve al tiempo cero.
- **Sin animación**: desactiva la cuenta atrás y presenta inmediatamente el estado final de la composición; al volver a activarla, deja la timeline preparada al inicio.
- **Pantalla completa**: solicita pantalla completa solamente para el contenedor de la escena.
- **Restablecer diseño**: recupera todos los valores iniciales y reinicia la reproducción.

Evita clics repetidos que puedan iniciar varias cuentas atrás. Refleja el estado con botones deshabilitados y atributos `aria-pressed` cuando proceda.

Si `prefers-reduced-motion: reduce` está activo en la primera visita y no existe una preferencia guardada, inicia con la animación desactivada. El usuario podrá volver a activarla manualmente.

## Pantalla completa y grabación

- Usa la Fullscreen API sobre el contenedor de la escena, no sobre toda la página.
- Dentro de pantalla completa solo se verán el lienzo y la cuenta atrás.
- No deben aparecer encabezado, tarjetas, botones, ayuda ni mensajes de validación.
- Centra la composición y conserva siempre el formato 16:9.
- Escape debe permitir salir mediante el comportamiento nativo del navegador.
- Oculta el cursor después de dos segundos sin movimiento sobre la escena y vuelve a mostrarlo al moverlo.
- Limpia temporizadores y listeners correctamente al cambiar de estado.
- No prometas que el lienzo lógico de 1920 × 1080 garantiza una grabación final a esa resolución.

## Accesibilidad y experiencia

- Toda la interfaz y sus mensajes estarán en español.
- Usa HTML semántico y un único `h1`.
- Cada campo debe tener una etiqueta visible.
- Asocia errores y ayudas mediante `aria-describedby`.
- Proporciona foco visible con contraste suficiente.
- Todos los controles deben funcionar con teclado.
- Usa regiones `aria-live` discretas para errores de URL y cambios relevantes de reproducción, sin anunciar cada pulsación de texto.
- Asegura un área táctil mínima aproximada de 44 × 44 píxeles.
- No dependas exclusivamente del color para indicar estados.

## Responsive

- **Escritorio**: cuadrícula bento de 12 columnas y escena amplia debajo.
- **Tablet**: tarjetas en dos columnas; la tarjeta de URL puede ocupar ambas.
- **Móvil**: una sola columna, campos anchos y acciones que se reorganizan sin desbordarse.
- La escena nunca cambia a una composición móvil: conserva 16:9 y se reduce proporcionalmente.
- Evita scroll horizontal en todos los tamaños.
- Usa `clamp()` donde ayude a mantener una escala tipográfica fluida.

## Calidad de implementación

- Mantén TypeScript estricto y evita `any`.
- Reutiliza constantes para selectores, valores iniciales y clave de almacenamiento.
- Comprueba la existencia y el tipo de cada elemento del DOM antes de utilizarlo.
- Limpia observadores, temporizadores y eventos si la inicialización se vuelve a ejecutar.
- No ocultes errores con bloques `catch` vacíos; degrada la persistencia sin romper la aplicación si `localStorage` no está disponible.
- No añadas funcionalidades fuera de este alcance.

## Validación obligatoria

Antes de dar el trabajo por terminado:

1. Ejecuta `npm run build` y corrige todos los errores de Astro y TypeScript.
2. Comprueba que cambiar colores y textos actualiza la escena sin recargar el `iframe`.
3. Verifica la carga de URL con botón y Enter, con y sin protocolo y con valores inválidos.
4. Comprueba la persistencia tras recargar y la recuperación ante JSON incompleto o dañado.
5. Prueba reproducir, pausar, continuar, reiniciar, repetir y alternar «Sin animación».
6. Confirma que los clics repetidos no duplican timelines ni cuentas atrás.
7. Verifica que pantalla completa muestra únicamente la escena y que Escape permite salir.
8. Revisa escritorio, tablet y móvil sin desbordamientos y manteniendo 16:9.
9. Prueba una URL compatible con `iframe` y otra bloqueada; la herramienta debe seguir siendo estable y mostrar la ayuda externa.
10. Revisa el flujo completo únicamente con teclado y con `prefers-reduced-motion`.

## Criterios de finalización

La implementación está terminada cuando una persona puede abrir la herramienta, cargar una web compatible, personalizar la composición, ejecutar o detener una única animación, entrar en pantalla completa y grabar una escena limpia; todo ello con una interfaz bento clara, responsive, accesible y sin errores de compilación.

Al finalizar, resume los archivos modificados, las comprobaciones realizadas y cualquier limitación inevitable del navegador. No presentes como resuelta la incrustación de sitios que la bloquean mediante sus propias cabeceras de seguridad.
