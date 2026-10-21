# Aaa-rriba

Juego de voz para niños de 8 a 9 años (3.º de primaria). El niño grita "Aaaa" para subir un globo
con un astronauta, cruza el aro con la respuesta correcta y, en la ronda bonus, dice palabras a
tiempo para llegar a los planetas.

Por ahora es solo el **front-end** (HTML, CSS y JavaScript sin frameworks). La tabla
"Tripulación estrella" se guarda en el navegador; más adelante se conectará al back-end.

## Cómo correrlo en VS Code

Los archivos de JavaScript son **módulos ES**, así que el juego necesita abrirse desde un servidor
local (no funciona con doble clic en `index.html`). El micrófono también lo exige: el navegador solo
lo permite en `localhost` o `https`.

1. Abre la carpeta `aaa-rriba` en VS Code.
2. Instala la extensión recomendada **Live Server** (VS Code la sugiere al abrir la carpeta).
3. Clic derecho en `index.html` → **Open with Live Server**.
4. Se abre en Chrome; acepta el permiso del micrófono.

Alternativa con Node: `npm start` (usa `npx serve`) y abre la dirección que aparece.

Alternativa con Python: `python3 serve.py` y abre `http://localhost:5500`. Usa este en lugar de
`python3 -m http.server`, que deja al navegador guardar versiones viejas de los archivos.

### Sin micrófono

Si el navegador no da el micrófono, el juego aparece en modo simulado: mantén la **barra
espaciadora** (o el botón "Mantén: Aaaa") para gritar y la **F** (o "¡AAAA! fuerte") para el grito
demasiado fuerte.

## Estructura

```
aaa-rriba/
├── index.html              Punto de entrada
├── assets/img/             Ilustraciones vectoriales (globo, base lunar, planetas, bandera)
├── assets/audio/           Frases grabadas de la narración (se crean con grabar.html)
├── grabar.html             Herramienta para grabar la narración
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
    ├── audio/              SoundEngine (sintetizador), Sfx (efectos), Narrator y narration.js (voz grabada)
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

Inicio → Credencial (nombre) → Tu misión → Prueba de comunicación (mide la voz) → Práctica (aro de
arriba, del medio y de abajo; sin puntos y se puede saltar) → 6 preguntas (3 niveles)
→ Misión cumplida → Ronda bonus (3 palabras) → Llegaste a los planetas → Tripulación estrella

## Narración (voz grabada)

Para los niños que todavía no leen bien, el tutorial, "Tu misión", la prueba de comunicación y la
práctica se escuchan con una voz grabada. El guion está en `js/audio/narration.js`: cada clave es el
nombre del archivo (`assets/audio/<clave>.wav`).

Para grabar o volver a grabar:

1. Corre el servidor local y abre `http://localhost:5500/grabar.html` en Chrome.
2. **Elegir carpeta** → `assets/audio`. Cada grabación se guarda sola ahí (en otros navegadores
   se descarga y hay que moverla a esa carpeta).
3. En cada frase: **Grabar**, leer, **Detener**. La herramienta recorta los silencios de las orillas
   e iguala el volumen.

Si una frase no está grabada, simplemente no suena. Mientras suena una frase, la medición de voz y
el globo de la práctica se esperan, para no confundir la grabación con la voz del niño.

## Medición de voz y ruido

En la prueba de comunicación ya no hay barra de sensibilidad: el juego la ajusta solo.

1. **Silencio** (unos 2 segundos): escucha el ruido del cuarto.
2. **Palabra**: el niño dice "¡Aaaa-rriba!". Con su voz y el ruido medido, `VoiceCalibration`
   acomoda la barra a **su voz**: el globo sube con sonidos de unos 8 dB por debajo de su voz hacia
   arriba y corre peligro unos 10 dB por encima. Como el niño está cerca del micrófono, las voces de
   otras personas del cuarto llegan más bajas y quedan debajo de la zona "Sube". Si no se le
   escucha, se le pide otra vez y cada intento acepta una voz más bajita. Con voz bajita la barra
   se achica (el piso se queda justo encima del ruido). Si su voz casi no se distingue del ruido,
   el juego le pide acercarse al micrófono en lugar de dar una medición con la que no podría jugar.
3. **Resultado**: "Tu voz es nivel n de 5" (según `CALIBRATION.voiceLevelDecibels`), con botones para
   medir otra vez o ir a la práctica. La barra del globo no se muestra mientras se mide el silencio.

Contra el ruido exterior, `VoiceInput` además pide al navegador supresión de ruido, filtra todo lo
que no esté en las frecuencias de la voz (150–3500 Hz) y durante el juego sigue el ruido del cuarto:
si aparece un ruido que se queda (salón, tráfico), la barra sube su piso poco a poco para que ese
ruido no mueva el globo. Todos los valores están en `VOICE` y `CALIBRATION` de `js/config.js`.

**Límite:** el juego mide qué tan fuerte llega el sonido, no reconoce de quién es la voz. Alguien
que grite o hable muy cerca del micrófono sí puede mover el globo. Lo que más ayuda es una diadema
o micrófono cerca de la boca del niño, y que nadie hable durante la medición.
