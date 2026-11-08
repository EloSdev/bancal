import { EditorContainer } from "../pods/editor";

// El <h1> lo pone el editor: lleva el nombre del bancal, que se carga.
export function BancalScene({ bancalId }: { bancalId: string }) {
  return <EditorContainer bancalId={bancalId} />;
}
