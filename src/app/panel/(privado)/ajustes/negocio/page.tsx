// /panel/ajustes/negocio: datos de contacto y reglas de reserva.

import { Campo } from "@/components/panel/Campo";
import { estilos } from "@/components/panel/estilos";
import { FormularioAjustes } from "@/components/panel/FormularioAjustes";
import { MINUTOS_POR_HUECO } from "@/lib/ajustes/validaciones";
import { crearClienteServidor, exigirAdmin } from "@/lib/supabase/sesion";
import { guardarNegocio } from "./acciones";

export default async function PaginaNegocio() {
  await exigirAdmin();

  const supabase = await crearClienteServidor();
  const { data: negocio, error } = await supabase
    .from("negocio")
    .select(
      "nombre, direccion, telefono, email, zona_horaria, minutos_por_hueco, antelacion_minima_min, dias_maximos_reserva, horas_limite_cancelar"
    )
    .maybeSingle();

  if (error) throw new Error(`No se ha podido leer el negocio: ${error.message}`);
  if (!negocio) {
    return (
      <p className={estilos.tarjeta}>
        No hay datos del negocio. Ejecutad supabase/schema.sql en Supabase.
      </p>
    );
  }

  return (
    <section className={estilos.tarjeta}>
      <FormularioAjustes accion={guardarNegocio} className="grid gap-6">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="rotulo mb-3 text-3xl">Datos</legend>

          <Campo id="nombre" etiqueta="Nombre" className="sm:col-span-2">
            <input id="nombre" name="nombre" required maxLength={100} defaultValue={negocio.nombre} className={estilos.campo} />
          </Campo>
          <Campo id="direccion" etiqueta="Dirección" className="sm:col-span-2">
            <input id="direccion" name="direccion" maxLength={200} defaultValue={negocio.direccion ?? ""} className={estilos.campo} />
          </Campo>
          <Campo id="telefono" etiqueta="Teléfono">
            <input id="telefono" name="telefono" type="tel" maxLength={30} defaultValue={negocio.telefono ?? ""} className={estilos.campo} />
          </Campo>
          <Campo id="email" etiqueta="Email">
            <input id="email" name="email" type="email" maxLength={200} defaultValue={negocio.email ?? ""} className={estilos.campo} />
          </Campo>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="rotulo mb-3 text-3xl">Reglas de reserva</legend>

          <Campo id="minutos_por_hueco" etiqueta="Minutos por hueco" ayuda="Cada cuánto se ofrecen horas: 10:00, 10:15…">
            <select
              id="minutos_por_hueco"
              name="minutos_por_hueco"
              defaultValue={String(negocio.minutos_por_hueco)}
              className={estilos.campo}
            >
              {MINUTOS_POR_HUECO.map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="antelacion_horas" etiqueta="Antelación mínima (horas)" ayuda="No se puede reservar con menos tiempo. De media en media hora.">
            <input
              id="antelacion_horas"
              name="antelacion_horas"
              type="number"
              inputMode="decimal"
              min={0}
              max={720}
              step={0.5}
              required
              // En la base de datos está en minutos; en pantalla, en horas.
              defaultValue={negocio.antelacion_minima_min / 60}
              className={estilos.campo}
            />
          </Campo>

          <Campo id="dias_maximos_reserva" etiqueta="Días máximos de reserva" ayuda="Hasta cuántos días por delante se puede reservar.">
            <input
              id="dias_maximos_reserva"
              name="dias_maximos_reserva"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              step={1}
              required
              defaultValue={negocio.dias_maximos_reserva}
              className={estilos.campo}
            />
          </Campo>

          <Campo id="horas_limite_cancelar" etiqueta="Horas límite para cancelar" ayuda="El cliente puede cancelar online hasta estas horas antes.">
            <input
              id="horas_limite_cancelar"
              name="horas_limite_cancelar"
              type="number"
              inputMode="numeric"
              min={0}
              max={720}
              step={1}
              required
              defaultValue={negocio.horas_limite_cancelar}
              className={estilos.campo}
            />
          </Campo>

          <Campo id="zona_horaria" etiqueta="Zona horaria" ayuda="No se puede cambiar.">
            {/* Sin "name": no se envía al guardar. */}
            <input id="zona_horaria" value={negocio.zona_horaria} readOnly disabled className={estilos.campo} />
          </Campo>
        </fieldset>
      </FormularioAjustes>
    </section>
  );
}
