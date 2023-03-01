import {Collection, ObjectId, Document} from 'mongodb';
import {Response} from 'express';
import {getDayName} from '../utils/index.js';
import {RequestMod} from '../middlewares/jwt.js';
import {db} from '../utils/databaseConnection.js';
import {getAll, DbServiceResponse} from '../services/dbServices.js';

import {Materia, Asignacion, Horario, Semana} from '../models/types';

export const coursesCollection: Collection = db.collection('materias');

const getCourses = async (req: RequestMod, res: Response) => {
  // Obtener todas las materias.
  const allCourses: DbServiceResponse = await getAll(coursesCollection);
  if (allCourses.error) {
    return res.status(500).json({
      error: true,
      msg: 'Error al obtener la lista de materias.',
    });
  }

  // Obtener materias con préstamos activos.
  const actives: DbServiceResponse = await getActiveCourses();
  if (actives.error) {
    return res.status(500).json({
      error: actives.error,
      msg: 'Error al obtener la lista de materias.',
    });
  }

  // Eliminar de las asignaciones los nrcs y maestros activos
  const inactiveData: Materia[] = allCourses.data.map((materia: Materia) => {
    const asignaciones = materia.asignaciones.filter((asignacion: Asignacion) => {
      for (let activeCourse of actives.data) {
        const areEqual = isCourseIn(activeCourse, asignacion);
        if (areEqual) {
          return false;
        }
      }

      return true;
    });

    return {
      ...materia,
      asignaciones,
    };
  });

  // Obtener materias que tengan horario de hoy y eliminar todas las que no.
  const dayName: Semana = getDayName();
  const todayData: (Materia | undefined)[] = inactiveData.map((materia: Materia) => {
    // Filtrar asignaciones, 
    const asignaciones: any = materia.asignaciones.map((asignacion: Asignacion) => {
      // Filtrar si el horario es del dia de hoy
      const horarios: Horario[] = asignacion.horarios.filter((horario: Horario) => {
        if (horario.dia === dayName) {
          return true;
        }

        return false;
      });

      return !horarios.length ? undefined: {
        ...asignacion,
        horarios,
      }
    }).filter((item: any) => item !== undefined);

    return !asignaciones.length ? undefined: {
      ...materia,
      asignaciones,
    }
  }).filter((item: any) => item !== undefined);

  res.status(200).json({
    data: todayData,
    error: false,
    msg: 'Lista de materias obtenida exitosamente.',
  });
}

/////////////////////////////
// Local Utils
/////////////////////////////
// Saber si el curso activo está en todos los cursos
function isCourseIn(activeCourse: any, asignacion: Asignacion) {
  if (activeCourse.nrc === asignacion.nrc) {
    return true;
  }

  if (!!asignacion.maestro && activeCourse.maestro === asignacion.maestro.nombre) {
    return true;
  }

  return false;
}

// Obtener las materias que tienen préstamos actvos
async function getActiveCourses(): Promise<DbServiceResponse> {
  try {
    const data = await coursesCollection.aggregate([
      {
        $lookup: {
          from: 'prestamos',
          localField: 'nombre',
          foreignField: 'materia.nombre',
          as: 'prestamo',
        }
      },
      {
        $unwind: '$prestamo'
      },
      {
        $match: {
          'prestamo.status': {
            $eq: 'activo'
          }
        }
      },
      {
        $project: {
          'materia': '$nombre',
          'status': '$prestamo.status',
          'nrc': '$prestamo.materia.nrc',
          'maestro': '$prestamo.maestro.nombre'
        }
      }
    ]).toArray() as any;
    return {
      error: false,
      data,
    };
  } catch(e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

export default {
  getCourses,
}
