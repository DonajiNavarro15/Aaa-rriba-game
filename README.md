# Aaa-rriba

Juego de voz para niños de 8 a 9 años (3.º de primaria). El niño grita "Aaaa" para subir un globo
con un astronauta, cruza el aro con la respuesta correcta y, en la ronda bonus, dice palabras a
tiempo para llegar a los planetas.

El **front-end** es HTML, CSS y JavaScript sin frameworks. El **servidor** (`server/`, Node y
Express) guarda en MongoDB las operaciones y la tabla "Tripulación estrella". Sin servidor el juego
sigue funcionando, con preguntas al azar y la tabla guardada en el navegador.

## Servidor y base de datos

Necesita Node 22.9 o más nuevo y una base de MongoDB, local o en Atlas.

1. `npm install`
2. Copia `.env.example` como `.env` y pon la dirección de tu base en `MONGODB_URI`.
3. `npm start` y abre `http://localhost:5500`. La primera vez llena el catálogo de operaciones.

`npm test` prueba el servidor con un Mongo temporal; no toca tu base.

- **Operaciones y palabras (`questions`).** Nivel 1 sumas y restas, nivel 2 multiplicaciones y nivel 3
  divisiones, con máximo una cifra de dos dígitos, más las palabras del bonus (`js/game/words.js`).
  Cada tipo es una fila revuelta que comparten todos los jugadores: cada partida toma
  las siguientes y, al acabarse, la fila vuelve a empezar.
- **Tripulación estrella (`ranking`).** Paginada, con índice por puntos, tiempo e id.

## Compartirlo con Docker

Solo necesitas Docker (Docker Desktop, o en Mac `brew install colima docker docker-compose` y
`colima start`). Levanta el juego y su base de datos, sin instalar Node ni Mongo:

```bash
docker compose up --build
```

Abre `http://localhost:5500`. La tabla se guarda aunque detengas los contenedores (`docker compose
down`); solo se borra con `docker compose down -v`. Es una base aparte de la de `npm start`, y ambos
usan el puerto 5500, así que no pueden correr al mismo tiempo.

El navegador solo da el micrófono en `localhost` o `https`: desde otra computadora de la red
(`http://192.168.x.x:5500`) no habrá micrófono y se jugará con las flechas. Para jugar con voz desde
otros equipos hay que publicarlo con `https`.

## Cómo correrlo en VS Code

Los archivos de JavaScript son **módulos ES**, así que el juego necesita abrirse desde un servidor
local (no funciona con doble clic en `index.html`). El micrófono también lo exige: el navegador solo
lo permite en `localhost` o `https`.

1. Abre la carpeta `aaa-rriba` en VS Code.
2. Instala la extensión recomendada **Live Server** (VS Code la sugiere al abrir la carpeta).
3. Clic derecho en `index.html` → **Open with Live Server**.
4. Se abre en Chrome; acepta el permiso del micrófono.

Alternativa con Python: `python3 serve.py` y abre `http://localhost:5500`. Usa este en lugar de
`python3 -m http.server`, que deja al navegador guardar versiones viejas de los archivos.

### Sin micrófono

Durante las preguntas, las **flechas del teclado** siempre mueven el globo en las cuatro direcciones.
Si el micrófono no oye nada, tras dos intentos la prueba de voz deja continuar con "¡A jugar!".

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
├── server/                 API, catálogo de operaciones y ranking en MongoDB
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
- **Datos detrás de una interfaz.** `RankingRepository` define `add()` y `getPage()`; `ApiRankingRepository`
  llama al servidor y `LocalRankingRepository` usa `localStorage` como respaldo.

## Flujo de pantallas

Inicio → Credencial (nombre) → Video de cómo se juega (se puede saltar) → Prueba de comunicación (mide la voz) → 6 preguntas
(3 niveles) → Misión cumplida → Ronda bonus (3 palabras) → Llegaste a los planetas → Tripulación estrella

Desde el inicio, **¿Cómo se juega?** también muestra el video.

## Video de "¿Cómo se juega?"

Es un video animado de unos 23 segundos hecho con el juego mismo (`js/screens/TutorialScreen.js`):
un niño simulado juega cada parte mientras se escucha la explicación grabada. No necesita archivo de
video y se actualiza solo si cambia el juego.

| Escena | Letrero | Frase grabada |
|---|---|---|
| El globo sube | Grita Aaaa: el globo sube | demo-sube |
| El globo baja | Guarda silencio: el globo baja | demo-silencio |
| Se revienta | Si gritas muy fuerte el globo se revienta | demo-revienta |
| Pregunta 6 × 7 | Pasa el globo por el aro con la respuesta correcta | demo-respuesta |
| Ronda bonus | Di la palabra antes de que se acabe el tiempo | demo-palabra |

Cada escena dura lo que su frase. Las frases salieron de grabaciones anteriores; se pueden volver a
grabar en `grabar.html` (grupo "Video de ¿Cómo se juega?"). Los tiempos están en `DEMO` de
`js/config.js`.

## Narración (voz grabada)

Para los niños que todavía no leen bien, el video y la prueba de comunicación se escuchan con una
voz grabada. El guion está en `js/audio/narration.js`: cada clave es el nombre del archivo
(`assets/audio/<clave>.wav`).

## Narración (voz grabada)


Para grabar o volver a grabar:

1. Corre el servidor local y abre `http://localhost:5500/grabar.html` en Chrome.
2. **Elegir carpeta** → `assets/audio`. Cada grabación se guarda sola ahí (en otros navegadores
   se descarga y hay que moverla a esa carpeta).
3. En cada frase: **Grabar**, leer, **Detener**. La herramienta recorta los silencios de las orillas
   e iguala el volumen.

Si una frase no está grabada, simplemente no suena. Mientras suena una frase, la medición de voz se
espera, para no confundir la grabación con la voz del niño.

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
3. **Resultado**: "Tu voz es suave", "media" o "fuerte" (según `CALIBRATION.voiceLevelDecibels`), con botones para
   medir otra vez o ir a jugar. La barra del globo no se muestra mientras se mide el silencio.

Contra el ruido exterior, `VoiceInput` además pide al navegador supresión de ruido, filtra todo lo
que no esté en las frecuencias de la voz (150–3500 Hz) y durante el juego sigue el ruido del cuarto:
si aparece un ruido que se queda (salón, tráfico), la barra sube su piso poco a poco para que ese
ruido no mueva el globo. Todos los valores están en `VOICE` y `CALIBRATION` de `js/config.js`.

### Solo el "Aaaa" mueve el globo

En las preguntas, el globo solo responde a una **"a" sostenida**, no a hablar
(`js/input/AaaDetector.js`). Cada cuadro se revisa que:

1. el sonido tenga tono, como una nota (un "Shhh" no lo tiene);
2. suene igual que hace un instante: al hablar, el sonido cambia en cada sílaba; en una "a"
   sostenida casi no cambia;
3. tenga algo de sonido agudo, que sale con la boca abierta (un "Mmm" casi no tiene);
4. dure al menos 0.25 s sin cortes (las sílabas duran menos; en "acamaya" las consonantes
   cortan la "a");
5. tenga un tono cercano al del niño, medido en su "Aaaa" de la prueba de voz (así no cuentan
   las voces graves de adultos).

No hace falta gritar: un "Aaaa" suave cuenta si se oye por encima del ruido del cuarto, y sube el
globo aunque no llegue a la zona "Sube" de la barra (más fuerte, sube más rápido; muy fuerte, se
revienta).

La ronda bonus sigue escuchando cualquier voz, porque ahí se dicen palabras. Los valores están en
`AAA` de `js/config.js`.

**Diagnóstico:** en la prueba de voz, la tecla **D** muestra en vivo el tono, qué tan parejo es,
qué tan igual suena, qué tan agudo y cuánto tiempo seguido lleva la "a". Si a un niño no le reconoce el
"Aaaa", ahí se ve qué regla falla y cuál valor de `AAA` ajustar.

**Límite:** el juego no reconoce de quién es la voz. Otro niño que grite "Aaaa" cerca del
micrófono sí puede mover el globo. Lo que más ayuda es una diadema
o micrófono cerca de la boca del niño, y que nadie hable durante la medición.
