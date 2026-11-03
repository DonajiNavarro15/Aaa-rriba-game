/**
 * Palabras de la ronda bonus. Son fáciles de decir y de reconocer: se evitan las que suenan
 * igual que otra (ola/hola, casa/caza), porque el reconocimiento de voz no las distingue.
 */
export const BONUS_WORDS = Object.freeze([
  // Espacio
  'COHETE', 'LUNA', 'ESTRELLA', 'PLANETA', 'SATURNO', 'MARTE', 'JÚPITER', 'COMETA', 'GALAXIA', 'ASTRONAUTA',
  'TIERRA', 'ESPACIO', 'NAVE', 'TELESCOPIO', 'GRAVEDAD', 'ÓRBITA', 'METEORITO', 'ECLIPSE', 'UNIVERSO', 'SATÉLITE',
  // Cielo y clima
  'NUBE', 'LLUVIA', 'VIENTO', 'TORMENTA', 'RELÁMPAGO', 'TRUENO', 'ARCOÍRIS', 'NIEVE', 'CIELO', 'GLOBO',
  // Animales
  'PERRO', 'GATO', 'CABALLO', 'CONEJO', 'TORTUGA', 'ELEFANTE', 'JIRAFA', 'TIGRE', 'LEÓN', 'MONO',
  'PINGÜINO', 'DELFÍN', 'BALLENA', 'TIBURÓN', 'MARIPOSA', 'ARAÑA', 'CANGURO', 'COCODRILO', 'ÁGUILA', 'LOBO',
  // Naturaleza
  'MONTAÑA', 'VOLCÁN', 'BOSQUE', 'DESIERTO', 'PLAYA', 'ISLA', 'RÍO', 'LAGO', 'SELVA', 'ÁRBOL',
  'FLOR', 'PIEDRA', 'ARENA', 'CASCADA', 'CUEVA',
  // Comida
  'MANZANA', 'PLÁTANO', 'NARANJA', 'FRESA', 'SANDÍA', 'MANGO', 'PIZZA', 'GALLETA', 'CHOCOLATE', 'PASTEL',
  'HELADO', 'QUESO', 'TORTILLA', 'ELOTE', 'PALOMITAS',
  // Escuela y casa
  'LÁPIZ', 'CUADERNO', 'MOCHILA', 'PIZARRÓN', 'MAESTRO', 'ESCUELA', 'RECREO', 'LIBRO', 'VENTANA', 'PUERTA',
  'ESPEJO', 'RELOJ', 'ALMOHADA', 'CUCHARA', 'TELÉFONO',
  // Juegos y aventuras
  'PELOTA', 'BICICLETA', 'PATINETA', 'CASTILLO', 'DRAGÓN', 'PIRATA', 'TESORO', 'ROBOT', 'MAGIA', 'AVENTURA',
  'SUPERHÉROE', 'TAMBOR', 'GUITARRA', 'AVIÓN', 'TREN', 'BARCO', 'SUBMARINO', 'CAMIÓN', 'PARACAÍDAS', 'MEDALLA',
]);
