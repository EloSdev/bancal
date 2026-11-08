import { FichaCultivoContainer } from "../pods/catalogo";

export function CultivoScene({ cultivoId }: { cultivoId: string }) {
  return <FichaCultivoContainer cultivoId={cultivoId} />;
}
