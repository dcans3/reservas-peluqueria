// /panel/ajustes/servicios: lista por orden, editar, flechas, activar/desactivar y añadir.

import { BotonAccion } from "@/components/panel/BotonAccion";
import { Campo } from "@/components/panel/Campo";
import { estilos } from "@/components/panel/estilos";
import { FormularioAjustes } from "@/components/panel/FormularioAjustes";
import { crearClienteServidor, exigirAdmin } from "@/lib/supabase/sesion";
import {
  cambiarActivoServicio,
  crearServicio,
  editarServicio,
  moverServicio,
} from "./acciones";

type Servicio = {
  id: number;
  nombre: string;
  duracion_min: number;
  precio: number | null;
  activo: boolean;
};

export default async function PaginaServicios() {
  await exigirAdmin();

  const supabase = await crearClienteServidor();
  const { data: servicios, error } = await supabase
    .from("servicios")
    .select("id, nombre, duracion_min, precio, activo")
    .order("orden")
    .order("id");

  if (error) throw new Error(`No se han podido leer los servicios: ${error.message}`);

  return (
    <div className="grid gap-4">
      <p className={estilos.ayuda}>
        Los servicios no se borran, porque las citas antiguas los usan. Desactivar uno lo oculta
        de la web de reservas.
      </p>

      <ul className="grid gap-3">
        {servicios.map((servicio, indice) => (
          <li key={servicio.id}>
            <TarjetaServicio
              servicio={servicio}
              esPrimero={indice === 0}
              esUltimo={indice === servicios.length - 1}
            />
          </li>
        ))}
      </ul>

      <section className={estilos.tarjeta}>
        <h2 className="rotulo mb-3 text-3xl">Añadir servicio</h2>
        <FormularioAjustes accion={crearServicio} textoBoton="Añadir" vaciarAlGuardar>
          <CamposServicio prefijo="nuevo" />
        </FormularioAjustes>
      </section>
    </div>
  );
}

function TarjetaServicio({
  servicio,
  esPrimero,
  esUltimo,
}: {
  servicio: Servicio;
  esPrimero: boolean;
  esUltimo: boolean;
}) {
  const id = String(servicio.id);

  return (
    <article className={`${estilos.tarjeta} ${servicio.activo ? "" : "opacity-70"}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-bold">
          {servicio.nombre}
          {!servicio.activo && (
            <span className="ml-2 rounded-full bg-papel px-2.5 py-0.5 text-sm text-tinta-suave">
              Desactivado
            </span>
          )}
        </h2>

        <BotonAccion
          accion={moverServicio}
          datos={{ id, direccion: "subir" }}
          texto="↑"
          etiqueta={`Subir ${servicio.nombre}`}
          estilo={estilos.botonIcono}
          disabled={esPrimero}
        />
        <BotonAccion
          accion={moverServicio}
          datos={{ id, direccion: "bajar" }}
          texto="↓"
          etiqueta={`Bajar ${servicio.nombre}`}
          estilo={estilos.botonIcono}
          disabled={esUltimo}
        />
        <BotonAccion
          accion={cambiarActivoServicio}
          datos={{ id, activo: servicio.activo ? "false" : "true" }}
          texto={servicio.activo ? "Desactivar" : "Activar"}
        />
      </div>

      <FormularioAjustes accion={editarServicio}>
        <input type="hidden" name="id" value={id} />
        <CamposServicio prefijo={`servicio-${id}`} servicio={servicio} />
      </FormularioAjustes>
    </article>
  );
}

/** Nombre, duración y precio. Sin "servicio" = formulario vacío (añadir). */
function CamposServicio({ prefijo, servicio }: { prefijo: string; servicio?: Servicio }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_9rem_9rem]">
      <Campo id={`${prefijo}-nombre`} etiqueta="Nombre">
        <input
          id={`${prefijo}-nombre`}
          name="nombre"
          required
          maxLength={100}
          defaultValue={servicio?.nombre}
          className={estilos.campo}
        />
      </Campo>
      <Campo id={`${prefijo}-duracion`} etiqueta="Duración (min)">
        <input
          id={`${prefijo}-duracion`}
          name="duracion_min"
          type="number"
          inputMode="numeric"
          min={1}
          max={600}
          step={1}
          required
          defaultValue={servicio?.duracion_min}
          className={estilos.campo}
        />
      </Campo>
      <Campo id={`${prefijo}-precio`} etiqueta="Precio (€)" ayuda="Vacío = sin precio">
        <input
          id={`${prefijo}-precio`}
          name="precio"
          type="number"
          inputMode="decimal"
          min={0}
          max={9999.99}
          step={0.01}
          defaultValue={servicio?.precio ?? ""}
          className={estilos.campo}
        />
      </Campo>
    </div>
  );
}
