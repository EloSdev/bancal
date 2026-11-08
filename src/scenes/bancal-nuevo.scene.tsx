import { useNavigate } from "@tanstack/react-router";
import { TituloPagina } from "../common/components/titulo-pagina";
import type { Bancal } from "../core/bancales/model";
import { NuevoBancalContainer } from "../pods/bancales";

export function BancalNuevoScene() {
  const navigate = useNavigate();
  // Recién creado, lo siguiente es plantar: al editor del bancal.
  const alGuardar = (bancal: Bancal) => navigate({ to: "/bancales/$bancalId", params: { bancalId: bancal.id } });

  return (
    <section className="space-y-6">
      <TituloPagina>Nuevo bancal</TituloPagina>
      <NuevoBancalContainer onGuardado={alGuardar} />
    </section>
  );
}
