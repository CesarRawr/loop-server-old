import {Collection, ObjectId, Document} from 'mongodb';
import {Response} from 'express';
import {RequestMod} from '../middlewares/jwt.js';
import {db} from '../utils/databaseConnection.js';
import {getAll, DbServiceResponse} from '../services/dbServices.js';

export const studentsCollection: Collection = db.collection('alumnos');

const getStudents = async (req: RequestMod, res: Response) => {
  // Obtener todos los alumnos.
  const allStudents: DbServiceResponse = await getAll(studentsCollection);
  if (allStudents.error) {
    return res.status(500).json({
      error: true,
      msg: 'Error al obtener la lista de alumnos.',
    });
  }

  // Obtener alumnos con préstamos activos.
  const actives: DbServiceResponse = await getActiveStudents();
  if (actives.error) {
    return res.status(500).json({
      error: actives.error,
      msg: 'Error al obtener la lista de alumnos.',
    });
  }

  // Obtener los alumnos que no tienen préstamos activos
  const data: any = allStudents.data.filter((student: any) => {
    return actives.data.some((active: any) => active.nombre !== student.nombre);
  });

  res.status(200).json({
    data: !!actives.data.length ? data: allStudents.data,
    error: false,
    msg: 'Lista de alumnos obtenida exitosamente.',
  });
}

/////////////////////////////
// Local Utils
/////////////////////////////
// Obtener las alumnos que tienen préstamos actvos
async function getActiveStudents(): Promise<DbServiceResponse> {
  try {
    const data = await studentsCollection.aggregate([
      {
        $lookup: {
          from: 'prestamos',
          localField: 'nombre',
          foreignField: 'alumno.nombre',
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
        $group: {
          _id: '$_id',
          nombre: {
            $first: '$nombre'
          },
          status: {
            $first: '$prestamo.status'
          }
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
  getStudents,
}
