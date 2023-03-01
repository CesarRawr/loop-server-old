import {Semana} from '../models/types';
// Obtener nombre del dia
export const getDayName = (): Semana => {
  const days: Semana[] = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado"
  ];

  return days[new Date().getDay()];
};