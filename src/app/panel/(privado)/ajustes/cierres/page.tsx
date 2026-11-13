// /panel/ajustes/cierres: cierres y vacaciones futuros, añadir y borrar.

import { BotonAccion } from "@/components/panel/BotonAccion";
import { Campo } from "@/components/panel/Campo";
import { estilos } from "@/components/panel/estilos";
import { FormularioAjustes } from "@/components/panel/FormularioAjustes";
import { describirPeriodo } from "@/lib/ajustes/cierres";
import { crearClienteServidor, exigirAdmin } from "@/lib/supabase/sesion";
import { borrarCierre, crearCierre } from "./acciones";

export default async function PaginaCierres() {
  await exigirAdmin();

  const supabase = await crearClienteServidor();
  const ahora = new Date().toISOString();

  const [negocio, profesionales, cierres] = await Promise.all([
    supabase.from("negocio").select("zona_horaria").maybeSingle(),
    supabase.from("profesionales").select("id, nombre, activo").order("id"),
    // Solo los que aún no han terminado, por fecha.
    supabase
      .from("ausencias")
      .select("id, profesional_id, inicio, fin, motivo")
      .gt("fin", ahora)
      .order("inicio"),
  ]);

  const fallo = negocio.error ?? profesionales.error ?? cierres.error;
  if (fallo) throw new Error(`No se han podido leer los cierres: ${fallo.message}`);

  if (!negocio.data) {
    return (
      <p className={estilos.tarjeta}>
        No hay datos del negocio. Ejecutad supabase/schema.sql en Supabase.
      </p>
    );
  }
  const zona = negocio.data.zona_horaria;
  const listaProfesionales = profesionales.data ?? [];
  const listaCierres = cierres.data ?? [];

  const nombreDe = (id: number | null) =>
    id === null
      ? "Toda la peluquería"
      : (listaProfesionales.find((p) => p.id === id)?.nombre ?? "Profesional");

  return (
    <div className="grid gap-4">
      <section className={estilos.tarjeta}>
        <h2 className="rotulo mb-3 text-3xl">Próximos cierres</h2>

        {listaCierres.length === 0 ? (
          <p className="rounded-[10px] bg-papel px-3.5 py-2.5 text-tinta-suave">
            No hay cierres ni vacaciones previstos.
          </p>
        ) : (
          <ul className="grid gap-2">
            {listaCierres.map((cierre) => (
              <li
                key={cierre.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] bg-papel px-3.5 py-3"
              >
                <div className="mr-auto grid">
                  <span className="font-bold">{nombreDe(cierre.profesional_id)}</span>
                  <span>{describirPeriodo(cierre.inicio, cierre.fin, zona)}</span>
                  {cierre.motivo && <span className="text-sm text-tinta-suave">{cierre.motivo}</span>}
                </div>
                <BotonAccion
                  accion={borrarCierre}
                  datos={{ id: String(cierre.id) }}
                  texto="Borrar"
                  confirmar="Sí, borrar"
                  estilo={estilos.botonPeligro}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={estilos.tarjeta}>
        <h2 className="rotulo mb-3 text-3xl">Añadir cierre</h2>
        <FormularioAjustes accion={crearCierre} textoBoton="Añadir cierre" vaciarAlGuardar>
          <Campo id="cierre-quien" etiqueta="¿Quién?">
            <select id="cierre-quien" name="profesional_id" defaultValue="" className={estilos.campo}>
              <option value="">Toda la peluquería</option>
              {listaProfesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.activo ? "" : " (desactivado)"}
                </option>
              ))}
            </select>
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="grid gap-3">
              <legend className={`${estilos.etiqueta} mb-2`}>Desde</legend>
              <Campo id="cierre-desde-fecha" etiqueta="Fecha">
                <input id="cierre-desde-fecha" name="desde_fecha" type="date" required className={estilos.campo} />
              </Campo>
              <Campo id="cierre-desde-hora" etiqueta="Hora" ayuda="Vacía = desde el principio del día">
                <input id="cierre-desde-hora" name="desde_hora" type="time" className={estilos.campo} />
              </Campo>
            </fieldset>

            <fieldset className="grid gap-3">
              <legend className={`${estilos.etiqueta} mb-2`}>Hasta</legend>
              <Campo id="cierre-hasta-fecha" etiqueta="Fecha">
                <input id="cierre-hasta-fecha" name="hasta_fecha" type="date" required className={estilos.campo} />
              </Campo>
              <Campo id="cierre-hasta-hora" etiqueta="Hora" ayuda="Vacía = hasta el final del día (incluido)">
                <input id="cierre-hasta-hora" name="hasta_hora" type="time" className={estilos.campo} />
              </Campo>
            </fieldset>
          </div>

          <Campo id="cierre-motivo" etiqueta="Motivo" ayuda="Opcional. Por ejemplo: Navidad, vacaciones, formación.">
            <input id="cierre-motivo" name="motivo" maxLength={200} className={estilos.campo} />
          </Campo>

          <p className={estilos.ayuda}>Las fechas y horas son de {zona}.</p>
        </FormularioAjustes>
      </section>
    </div>
  );
}
