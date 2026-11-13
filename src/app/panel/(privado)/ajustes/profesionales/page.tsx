// /panel/ajustes/profesionales: nombre, color de la agenda, servicios que hace
// y activar/desactivar. También añadir.

import { BotonAccion } from "@/components/panel/BotonAccion";
import { Campo } from "@/components/panel/Campo";
import { estilos } from "@/components/panel/estilos";
import { FormularioAjustes } from "@/components/panel/FormularioAjustes";
import { crearClienteServidor, exigirAdmin } from "@/lib/supabase/sesion";
import { cambiarActivoProfesional, crearProfesional, editarProfesional } from "./acciones";

type Profesional = { id: number; nombre: string; color: string; activo: boolean };
type Servicio = { id: number; nombre: string; activo: boolean };

export default async function PaginaProfesionales() {
  await exigirAdmin();

  const supabase = await crearClienteServidor();
  const [profesionales, servicios, relaciones] = await Promise.all([
    supabase.from("profesionales").select("id, nombre, color, activo").order("id"),
    supabase.from("servicios").select("id, nombre, activo").order("orden").order("id"),
    supabase.from("profesional_servicios").select("profesional_id, servicio_id"),
  ]);

  const fallo = profesionales.error ?? servicios.error ?? relaciones.error;
  if (fallo) throw new Error(`No se han podido leer los profesionales: ${fallo.message}`);

  const listaProfesionales = profesionales.data ?? [];
  const listaServicios = servicios.data ?? [];
  const listaRelaciones = relaciones.data ?? [];

  /** ids de los servicios que hace un profesional. */
  const serviciosDe = (profesionalId: number) =>
    listaRelaciones
      .filter((r) => r.profesional_id === profesionalId)
      .map((r) => r.servicio_id as number);

  return (
    <div className="grid gap-4">
      <p className={estilos.ayuda}>
        Los profesionales no se borran, porque las citas antiguas los usan. Desactivar uno lo
        quita de la web de reservas.
      </p>

      <ul className="grid gap-3">
        {listaProfesionales.map((profesional) => (
          <li key={profesional.id}>
            <TarjetaProfesional
              profesional={profesional}
              servicios={listaServicios}
              marcados={serviciosDe(profesional.id)}
            />
          </li>
        ))}
      </ul>

      <section className={estilos.tarjeta}>
        <h2 className="rotulo mb-3 text-3xl">Añadir profesional</h2>
        <FormularioAjustes accion={crearProfesional} textoBoton="Añadir" vaciarAlGuardar>
          <CamposProfesional prefijo="nuevo" servicios={listaServicios} marcados={[]} />
        </FormularioAjustes>
      </section>
    </div>
  );
}

function TarjetaProfesional({
  profesional,
  servicios,
  marcados,
}: {
  profesional: Profesional;
  servicios: Servicio[];
  marcados: number[];
}) {
  const id = String(profesional.id);

  return (
    <article className={`${estilos.tarjeta} ${profesional.activo ? "" : "opacity-70"}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          aria-hidden
          className="size-4 rounded-full"
          style={{ backgroundColor: profesional.color }}
        />
        <h2 className="mr-auto text-lg font-bold">
          {profesional.nombre}
          {!profesional.activo && (
            <span className="ml-2 rounded-full bg-papel px-2.5 py-0.5 text-sm text-tinta-suave">
              Desactivado
            </span>
          )}
        </h2>
        <BotonAccion
          accion={cambiarActivoProfesional}
          datos={{ id, activo: profesional.activo ? "false" : "true" }}
          texto={profesional.activo ? "Desactivar" : "Activar"}
        />
      </div>

      <FormularioAjustes accion={editarProfesional}>
        <input type="hidden" name="id" value={id} />
        <CamposProfesional
          prefijo={`profesional-${id}`}
          profesional={profesional}
          servicios={servicios}
          marcados={marcados}
        />
      </FormularioAjustes>
    </article>
  );
}

function CamposProfesional({
  prefijo,
  profesional,
  servicios,
  marcados,
}: {
  prefijo: string;
  profesional?: Profesional;
  servicios: Servicio[];
  marcados: number[];
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <Campo id={`${prefijo}-nombre`} etiqueta="Nombre">
          <input
            id={`${prefijo}-nombre`}
            name="nombre"
            required
            maxLength={100}
            defaultValue={profesional?.nombre}
            className={estilos.campo}
          />
        </Campo>
        <Campo id={`${prefijo}-color`} etiqueta="Color en la agenda">
          <input
            id={`${prefijo}-color`}
            name="color"
            type="color"
            defaultValue={profesional?.color ?? "#7c3aed"}
            className="h-12 w-full cursor-pointer rounded-lg border-[1.5px] border-renglon bg-hoja p-1"
          />
        </Campo>
      </div>

      <fieldset>
        <legend className={`${estilos.etiqueta} mb-2`}>Servicios que hace</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {servicios.map((servicio) => (
            <label key={servicio.id} className="flex items-center gap-2.5 rounded-lg bg-papel px-3 py-2.5">
              <input
                type="checkbox"
                name="servicios"
                value={servicio.id}
                defaultChecked={marcados.includes(servicio.id)}
                className="size-5 accent-verde"
              />
              <span>
                {servicio.nombre}
                {!servicio.activo && <span className="text-sm text-tinta-suave"> (desactivado)</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
