import {Collection, ObjectId, Document} from 'mongodb';
import {Response} from 'express';
import {RequestMod} from '../middlewares/jwt.js';
import {db} from '../utils/databaseConnection.js';
import {getAll, DbServiceResponse} from '../services/dbServices.js';

export const classroomCollection: Collection = db.collection('aulas');

const getClassrooms = async (req: RequestMod, res: Response) => {
  // Obtener todas las aulas.
  const allClassrooms: DbServiceResponse = await getAll(classroomCollection);
  if (allClassrooms.error) {
    return res.status(500).json({
      error: true,
      msg: 'Error al obtener la lista de aulas.',
    });
  }

  // Obtener aulas con préstamos activos.
  const actives: DbServiceResponse = await getActiveClassrooms();
  if (actives.error) {
    return res.status(500).json({
      error: actives.error,
      msg: 'Error al obtener la lista de aulas.',
    });
  }

  // Obtener las aulas que no tienen préstamos activos
  const data: Aula[] = allClassrooms.data.filter((classroom: Aula) => {
    for (let classroomActive of actives.data) {
      if (classroomActive.nombre === classroom.nombre) {
        return false;
      }
    }

    return true;
  });

  res.status(200).json({
    data,
    error: false,
    msg: 'Lista de aulas obtenida exitosamente.',
  });
}

/////////////////////////////
// Local Utils
/////////////////////////////
// Obtener las aulas que tienen préstamos actvos
async function getActiveClassrooms(): Promise<DbServiceResponse> {
  try {
    const data = await classroomCollection.aggregate([
      {
        $lookup: {
          from: 'prestamos',
          localField: 'nombre',
          foreignField: 'materia.horario.aula',
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
    ]).toArray() as Aula[];
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
  getClassrooms,
}

export interface Aula {
  _id: ObjectId;
  nombre: string;
  status?: "entrante" | "activo" | "deuda" | "inactivo";
}
