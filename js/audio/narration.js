/**
 * Guion de la narración: cada frase que se escucha antes del juego real.
 * La clave es el nombre del archivo grabado (assets/audio/<clave>.wav) y el texto es lo que
 * se lee al grabar en grabar.html. Para cambiar una frase, cambia el texto y vuelve a grabarla.
 * Tono: una guía de la misión que acompaña al niño (8 a 9 años). Le habla con cariño, le dice
 * por qué hace cada cosa y lo tranquiliza; frases naturales, como dichas en persona.
 */
export const NARRATION = Object.freeze({
  // Tutorial (¿Cómo se juega?)
  'tutorial-1':
    '¡Hola, astronauta! Primero, guarda silencio. Shhh. Luego grita: ¡Aaaa-rriba! Después debes de aprender a volar, así que practicaremos un poco. Tranquilo, ¡ahí no pierdes!',
  'tutorial-2':
    'Ahora te enseño a volar. Cuando gritas Aaaa, el globo sube, sube y sube. Cuando guardas silencio, baja despacito. Pero ojo: no grites demasiado fuerte, porque ¡pum!, el globo se revienta.',
  'tutorial-3':
    'En tu viaje vas a ver cuentas, como seis por siete. Piensa cuánto es… ¡cuarenta y dos! Entonces lleva tu globo al aro que tiene el cuarenta y dos. ¡Así de fácil!',
  'tutorial-4':
    'Al final viene una ronda especial. Va a salir una palabra, y tienes que decirla en voz alta antes de que se acabe el tiempo. ¡Cada palabra te da puntos extra!',
  'tutorial-5':
    'Mientras más puntos juntes, más lejos llegas. ¡Llega a los planetas y gana un lugar en la tabla de campeones! ¿Preparamos el despegue?',

  // Tu misión
  mision:
    'Antes de despegar, recuerda: gritas y el globo sube, guardas silencio y el globo baja. No grites demasiado fuerte, ¿eh? Y busca siempre el aro con la respuesta. ¡Tú puedes!',

  // Prueba de comunicación
  'voz-silencio': 'Vamos a probar tu micrófono. Primero, guarda silencio un momentito. Shhh…',
  'voz-palabra': '¡Muy bien! Ahora sí, grita con fuerza: ¡Aaaa-rriba!',
  'voz-no-escuche': 'Mmm, no te escuché. Acércate un poquito al micrófono y grita otra vez, más fuerte.',
  'voz-muy-bajita': 'Te escucho muy bajito. Ponte muy cerca del micrófono y vuelve a gritar, ¡con muchas ganas!',
  'voz-sin-microfono': 'Uy, no encuentro el micrófono. Pídele ayuda a un adulto, por favor.',
  'voz-nivel-1': '¡Listo! Ya conozco tu voz: es nivel uno. Ahora grita Aaaa y mira cómo sube tu globo.',
  'voz-nivel-2': '¡Listo! Ya conozco tu voz: es nivel dos. Ahora grita Aaaa y mira cómo sube tu globo.',
  'voz-nivel-3': '¡Listo! Ya conozco tu voz: es nivel tres. Ahora grita Aaaa y mira cómo sube tu globo.',
  'voz-nivel-4': '¡Listo! Ya conozco tu voz: es nivel cuatro. Ahora grita Aaaa y mira cómo sube tu globo.',
  'voz-nivel-5': '¡Listo! Ya conozco tu voz: es nivel cinco. Ahora grita Aaaa y mira cómo sube tu globo.',

  // Práctica: al empezar cada ejercicio
  'practica-1': 'Ahora sí, a aprender a volar. Primero, sube hasta el aro de arriba. Para llegar, grita Aaaa sin parar.',
  'practica-2':
    'Ahora vamos al aro de en medio. Este es un poco más difícil: grita un poquito, descansa, y vuelve a gritar. Así el globo se queda en medio.',
  'practica-3': 'Y el último: el aro de abajo. Grita poquito para despegar, y luego guarda silencio para que el globo baje.',
  // Práctica: avisos
  'practica-pum': '¡Pum! Gritaste muy fuerte y el globo se reventó. No pasa nada, aquí estamos practicando. Inténtalo otra vez, un poco más suave.',
  'practica-casi': '¡Uy, casi! El globo tiene que pasar por adentro del aro. Vamos otra vez.',
  'practica-ese-no-1': 'Ese no era. Recuerda, buscamos el aro de arriba. ¡Otra vez!',
  'practica-ese-no-2': 'Ese no era. Recuerda, buscamos el aro de en medio. ¡Otra vez!',
  'practica-ese-no-3': 'Ese no era. Recuerda, buscamos el aro de abajo. ¡Otra vez!',
  'practica-bien-1': '¡Muy bien! Ya pasaste el primer aro. ¡Vas aprendiendo!',
  'practica-bien-2': '¡Excelente! Ya van dos. Solo falta uno.',
  'practica-completa': '¡Lo lograste! Ya sabes volar. Ahora sí, ¡vamos a la misión de verdad!',
});
