# Aaa-rriba

Juego de voz para niños de 8 a 9 años (3.º de primaria). El niño grita «Aaaa» para subir un globo
con un astronauta, cruza el aro con la respuesta correcta y, en la ronda bonus, dice palabras a
tiempo para llegar a los planetas.

Por ahora es solo el **front-end** (HTML, CSS y JavaScript sin frameworks). La tabla
«Tripulación estrella» se guarda en el navegador; más adelante se conectará al back-end.

## Cómo correrlo en VS Code

Los archivos de JavaScript son **módulos ES**, así que el juego necesita abrirse desde un servidor
local (no funciona con doble clic en `index.html`). El micrófono también lo exige: el navegador solo
lo permite en `localhost` o `https`.

1. Abre la carpeta `aaa-rriba` en VS Code.
2. Instala la extensión recomendada **Live Server** (VS Code la sugiere al abrir la carpeta).
3. Clic derecho en `index.html` → **Open with Live Server**.
4. Se abre en Chrome; acepta el permiso del micrófono.

Alternativa con Node: `npm start` (usa `npx serve`) y abre la dirección que aparece.

### Sin micrófono

Si el navegador no da el micrófono, el juego aparece en modo simulado: mantén la **barra
espaciadora** (o el botón «Mantén: Aaaa») para gritar y la **F** (o «¡AAAA! fuerte») para el grito
demasiado fuerte.

## Estructura

```
aaa-rriba/
├── index.html              Punto de entrada
├── assets/img/             Ilustraciones vectoriales (globo, base lunar, planetas, bandera)
├── css/
│   ├── main.css            Importa todas las hojas en orden
│   ├── tokens.css          Colores, tipografías, radios y sombras (variables CSS)
│   ├── base.css            Reset, escenario 960×600 y utilidades de texto
│   ├── animations.css      Todas las @keyframes y clases de animación
│   └── components/         Un archivo por componente (botones, paneles, HUD, aros…)
└── js/
    ├── main.js             Arranca la app
    ├── config.js           Todas las constantes del juego (umbrales, física, palabras…)
    ├── core/               App (navegación entre pantallas), Screen (clase base), GameLoop, Stage
    ├── audio/              SoundEngine (sintetizador) y Sfx (efectos con nombre)
    ├── input/              VoiceInput (micrófono), SimulatedVoice (teclado/botones), WordListener (bonus)
    ├── game/               Reglas puras: preguntas, vuelo del globo, sesión de juego, ranking
    ├── ui/                 Componentes HTML reutilizables, íconos, efectos visuales
    └── screens/            Una clase por pantalla del flujo principal
```

### Reglas que sigue el código

- **Una responsabilidad por módulo.** La lógica del juego (`js/game/`) no toca el DOM; las pantallas
  (`js/screens/`) solo dibujan y conectan eventos.
- **Sin números mágicos.** Todo valor ajustable vive en `js/config.js`.
- **Componentes reutilizables.** Botones, paneles, encabezados, HUD y medidor se generan con
  funciones de `js/ui/components.js` y comparten las clases de `css/components/`.
- **Pantallas con ciclo de vida.** Cada pantalla hereda de `Screen`, que limpia automáticamente
  timers, bucles y listeners al salir.
- **Datos detrás de una interfaz.** `RankingRepository` define `getAll()` y `add()`; hoy usa
  `localStorage` y después se cambia por una versión que llame al API sin tocar las pantallas.

## Flujo de pantallas

Inicio → Credencial (nombre) → Prueba de comunicación → Tu misión → 6 preguntas (3 niveles)
→ Misión cumplida → Ronda bonus (3 palabras) → Llegaste a los planetas → Tripulación estrella
