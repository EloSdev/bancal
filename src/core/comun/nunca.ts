// Cierre de los switch sobre uniones discriminadas (EstadoPlanta, Aviso):
//   default: return nunca(estado);
// Si falta un caso, `estado` no es `never` y no compila (C3.2). Si aun así
// llega un caso en ejecución (datos corruptos), lanza en vez de seguir callado.
export function nunca(valor: never): never {
  const tipo = (valor as { tipo?: unknown } | null)?.tipo ?? valor;
  throw new Error(`Caso no previsto: ${String(tipo)}`);
}
