import {Collection, ObjectId, Document} from 'mongodb';
import {Response} from 'express';
import {RequestMod} from '../middlewares/jwt.js';
import {db} from '../utils/databaseConnection.js';
import {getAll, DbServiceResponse} from '../services/dbServices.js';

export const teachersCollection: Collection = db.collection('maestros');

const getTeachers = async (req: RequestMod, res: Response) => {
  // Obtener todos los maestros.
  const allTeachers: DbServiceResponse = await getAll(teachersCollection);
  if (allTeachers.error) {
    return res.status(500).json({
      error: true,
      msg: 'Error al obtener la lista de maestros.',
    });
  }

  // Obtener maestros con préstamos activos.
  const actives: DbServiceResponse = await getActiveTeachers();
  if (actives.error) {
    return res.status(500).json({
      error: actives.error,
      msg: 'Error al obtener la lista de maestros.',
    });
  }

  // Obtener los maestros que no tienen préstamos activos
  const data: any = allTeachers.data.filter((teacher: any) => {
    for (let activeTeacher of actives.data) {
      if (activeTeacher.nombre === teacher.nombre) {
        return false;
      }
    }

    return true;
  });
  
  res.status(200).json({
    data,
    error: false,
    msg: 'Lista de maestros obtenida exitosamente.',
  });
}

/////////////////////////////
// Local Utils
/////////////////////////////
// Obtener las maestros que tienen préstamos actvos
async function getActiveTeachers(): Promise<DbServiceResponse> {
  try {
    const data = await teachersCollection.aggregate([
      {
        $lookup: {
          from: 'prestamos',
          localField: 'nombre',
          foreignField: 'maestro.nombre',
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
  getTeachers,
}
