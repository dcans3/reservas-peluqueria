alter table negocio
  add constraint negocio_minutos_por_hueco_check check (minutos_por_hueco > 0),
  add constraint negocio_antelacion_minima_min_check check (antelacion_minima_min >= 0),
  add constraint negocio_dias_maximos_reserva_check check (dias_maximos_reserva > 0),
  add constraint negocio_horas_limite_cancelar_check check (horas_limite_cancelar >= 0);
