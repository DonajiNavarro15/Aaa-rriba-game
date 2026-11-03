/**
 * Guion de la narración: cada frase que se escucha antes del juego real (video y prueba de voz).
 * La clave es el nombre del archivo grabado (assets/audio/<clave>.wav) y el texto es lo que
 * se lee al grabar en grabar.html. Para cambiar una frase, cambia el texto y vuelve a grabarla.
 * Tono: una guía de la misión que acompaña al niño (8 a 9 años). Le habla con cariño, le dice
 * por qué hace cada cosa y lo tranquiliza; frases naturales, como dichas en persona.
 */
export const NARRATION = Object.freeze({
  // Video de ¿Cómo se juega? (recortadas de grabaciones anteriores)
  'demo-sube': 'Cuando gritas Aaaa, el globo sube, sube y sube.',
  'demo-silencio': 'Shhh… cuando guardas silencio, el globo baja.',
  'demo-revienta': 'Si gritas muy fuerte, el globo se revienta.',
  'demo-respuesta': 'Pasa el globo por el aro con la respuesta correcta.',
  'demo-palabra': 'Va a salir una palabra, y tienes que decirla en voz alta antes de que se acabe el tiempo.',

  // Prueba de comunicación
  'voz-silencio': 'Vamos a probar la comunicación con la base. Primero, guarda silencio un momentito. Shhh…',
  'voz-palabra': '¡Muy bien! Ahora sí, grita con fuerza: ¡Aaaa-rriba!',
  'voz-no-escuche': 'Mmm, no te escuché. Acércate un poquito al micrófono y grita otra vez, más fuerte.',
  'voz-muy-bajita': 'Te escucho muy bajito. Ponte muy cerca del micrófono y vuelve a gritar, ¡con muchas ganas!',
  'voz-sin-microfono': 'Uy, no encuentro el micrófono. Pídele ayuda a un adulto, por favor.',
  'voz-nivel-1': '¡Listo! Tu voz es suave. Di Aaa para ver qué tan fuerte debes de hablar.',
  'voz-nivel-2': '¡Listo! Tu voz es suave. Di Aaa para ver qué tan fuerte debes de hablar.',
  'voz-nivel-3': '¡Listo! Tu voz es media. Di Aaa para ver qué tan fuerte debes de hablar.',
  'voz-nivel-4': '¡Listo! Tu voz es fuerte. Di Aaa para ver qué tan fuerte debes de hablar.',
  'voz-nivel-5': '¡Listo! Tu voz es fuerte. Di Aaa para ver qué tan fuerte debes de hablar.',

});
