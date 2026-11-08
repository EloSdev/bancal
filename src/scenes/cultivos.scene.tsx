import { useNavigate } from "@tanstack/react-router";
import type { FiltrosCatalogo } from "../core/cultivos/filtros";
import { CatalogoContainer } from "../pods/catalogo";

export function CultivosScene({ filtros }: { filtros: FiltrosCatalogo }) {
  const navigate = useNavigate({ from: "/cultivos/" });

  // Cambiar un filtro es navegar: recargar o compartir la URL conserva el
  // resultado. Siempre sobre `prev`, la última búsqueda pedida aunque el
  // router aún no la haya confirmado: así un desplegable no pisa letras
  // recién escritas. Escribir sustituye la entrada del historial (no una por
  // tecla); filtrar y quitar filtros añaden una, para poder volver atrás.
  const buscar = (q?: string) => navigate({ search: (prev) => ({ ...prev, q }), replace: true });
  const filtrar = (cambio: Omit<FiltrosCatalogo, "q">) => navigate({ search: (prev) => ({ ...prev, ...cambio }) });
  const quitarFiltros = () => navigate({ search: (prev) => ({ zona: prev.zona }) });

  return (
    <section className="space-y-8">
      <div className="max-w-2xl space-y-3">
        <h1>Cultivos</h1>
        <p className="text-lg text-tinta-suave">
          Todos caben en una celda de 30 × 30 cm. Busca por nombre o filtra por el sol que piden, cuándo se siembran y
          tu zona.
        </p>
      </div>
      <CatalogoContainer filtros={filtros} onBuscar={buscar} onFiltrar={filtrar} onQuitarFiltros={quitarFiltros} />
    </section>
  );
}
