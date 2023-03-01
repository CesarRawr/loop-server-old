import {Collection} from 'mongodb';
import {Response} from 'express';
import {RequestMod} from '../middlewares/jwt.js';
import {db} from '../utils/databaseConnection.js';
import {getAll, DbServiceResponse} from '../services/dbServices.js';

export const deviceCollection: Collection = db.collection('dispositivos');

const getAllDevices = async (req: RequestMod, res: Response) => {
  const devices: DbServiceResponse = await getAll(deviceCollection);

  if (devices.error) {
    return res.status(500).json({
      error: devices.error,
      msg: 'Error al obtener la lista de dispositivos.',
    });
  }

  res.status(200).json({
    ...devices,
    msg: 'Lista de dispositivos obtenida exitosamente.',
  });
}

export default {
  getAllDevices,
}

export interface Dispositivo {
  _id: string; 
  nombre: string; 
  stock?: number;
  prestado?: number;
  localPrestado: number;
}
