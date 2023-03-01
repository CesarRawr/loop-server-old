import {Collection} from 'mongodb';
import {Response} from 'express';
import {RequestMod} from '../middlewares/jwt.js';
import {db} from '../utils/databaseConnection.js';
import {Dispositivo, deviceCollection} from './devices.js';

import {
  getOne,
  saveOne, 
  getAll, 
  updateOne, 
  DbServiceResponse
} from '../services/dbServices.js';

export const loanCollection: Collection = db.collection('prestamos');

const uploadLoan = async (req: RequestMod, res: Response) => {
  const prestamo: Prestamo = req.body;
  const {dispositivos} = prestamo;

  // Aumentando la cantidad prestada de cada dispositivo
  // en el préstamo
  for (let dispositivo of dispositivos) {
    const result: DbServiceResponse = await updateOne(deviceCollection, {_id: dispositivo._id}, {
      $inc: {prestado: dispositivo.localPrestado}
    });

    // Si falla la actualización
    if (result.error) {
      return res.status(500).json({
        error: true,
        msg: "Error al guardar el préstamo en la base de datos",
      });
    }
  }

  // Guardando el préstamo
  const result: DbServiceResponse = await saveOne(loanCollection, prestamo);
  if (result.error) {
    return res.status(500).json({
      error: true,
      msg: "Error al guardar el préstamo en la base de datos",
    });
  }

  res.json({
    error: false,
    msg: 'Préstamo realizado con éxito',
  });
}

const getAllLoans = async (req: RequestMod, res: Response) => {
  const response: DbServiceResponse = await getAll(loanCollection);
  if (response.error) {
    return res.status(500).json({
      error: true,
      msg: "Error al obtener los prestamos de la base de datos",
    });
  }

  res.status(200).json({
    ...response,
    msg: 'Lista de préstamos obtenida con éxito',
  });
}

const getActiveLoans = async (req: RequestMod, res: Response) => {
  const response: DbServiceResponse = await getAll(loanCollection, {status: 'activo'});
  if (response.error) {
    return res.status(500).json({
      error: true,
      msg: "Error al obtener los prestamos activos de la base de datos",
    });
  }

  res.status(200).json({
    ...response,
    msg: 'Lista de préstamos activos obtenida con éxito',
  });
}

const returnLoan = async (req: RequestMod, res: Response) => {
  const loanID = req.body.loanID;
  let result: DbServiceResponse = await getOne(loanCollection, loanID);
  if (result.error || !result.data) {
    return res.status(500).json({
      error: true,
      msg: 'Error al regresar el préstamo en la base de datos',
    });
  }

  const loan: Prestamo = result.data;
  if (loan.status === 'inactivo') {
    return res.status(400).json({
      error: true,
      msg: 'El préstamo que quiere regresar ya se encuentra inactivo',
    });
  }

  const dispositivos: Dispositivo[] = loan.dispositivos;
  // Regresando los dispositivos prestados
  for (let dispositivo of dispositivos) {
    const result: DbServiceResponse = await updateOne(deviceCollection, {_id: dispositivo._id}, {
      $inc: {prestado: -dispositivo.localPrestado}
    });

    // Si falla la actualización
    if (result.error) {
      return res.status(500).json({
        error: true,
        msg: "Error al regresar el préstamo en la base de datos",
      });
    }
  }

  // Quitando el estado activo al préstamo
  result = await updateOne(loanCollection, loanID, {
    $set: {status: "inactivo"}
  });

  if (result.error) {
    return res.status(500).json({
      error: true,
      msg: "Error al regresar el préstamo en la base de datos",
    });
  }

  res.json({
    error: false,
    msg: 'Préstamo regresado con éxito',
  });
}

const updateLoan = async (req: RequestMod, res: Response) => {
  const {loanID, changedDevices, deletedDevices} = req.body;
  // Si algun atributo no existe
  if (!changedDevices || !deletedDevices) {
    return res.status(401).json({
      error: true,
      msg: 'Error en petición',
    });
  }

  // Si ambos array están vacios
  if (!changedDevices.length && !deletedDevices.length) {
    return res.status(401).json({
      error: true,
      msg: 'Error en petición',
    });
  }

  // Obtener lista de dispositivos del préstamo
  const {error, data}: DbServiceResponse = await getOne(loanCollection, loanID, {projection: { dispositivos: 1}});
  if (error || !data) {
    return res.status(500).json({
      error: true,
      msg: 'Error al regresar el préstamo en la base de datos',
    });
  }

  // Eliminar dispositivos eliminados en la base de datos
  if (!!deletedDevices.length) {
    deletedDevices.forEach(async (deletedDevice: any) => {
      const response: DbServiceResponse = await updateOne(deviceCollection, {_id: deletedDevice.deviceID}, {
        $inc: {prestado: -deletedDevice.difference}
      });
    });
  }

  // Quitar los dispositivos eliminados de los dispositivos originales
  const withoutDeletedDevices: any = !deletedDevices.length ? 
  [...data.dispositivos]: data.dispositivos.filter((originalDevice: any) => {
    const wasDeleted: boolean = deletedDevices.some((deletedDevice: any) => deletedDevice.deviceID === originalDevice._id);
    return !wasDeleted;
  });

  console.log('changedDevices');
  console.log(changedDevices);
  console.log('Dispositivos que fueron eliminados');
  console.log(deletedDevices);
  console.log('Lista de dispositivos sin el dispositivo eliminado');
  console.log(withoutDeletedDevices);

  // Actualizar cambios de los dispositivos en la base de datos
  // Esto actualiza tanto los dispositivos que son nuevos en el préstamo como los que no
  if (!!changedDevices.length) {
    changedDevices.forEach(async (changedDevice: any) => {
      const result: DbServiceResponse = await updateOne(deviceCollection, {_id: changedDevice.deviceID}, {
        $inc: {prestado: changedDevice.difference}
      });
    });
  }

  // Actualizando en la lista de dispositivos originales del prestamo, 
  // aquellos a los que se les suma o resta cantidad.
  const devicesWithChanges: any = withoutDeletedDevices.map((originalDevice: any) => {
    const deviceWithChange: any = changedDevices.filter((changedDevice: any) => changedDevice.deviceID === originalDevice._id);
    if (!deviceWithChange.length) {
      return {
        _id: originalDevice._id,
        nombre: originalDevice.nombre,
        localPrestado: originalDevice.localPrestado,
      };
    }

    const [changedDevice, ...nothing] = deviceWithChange;
    return {
      ...originalDevice,
      localPrestado: originalDevice.localPrestado+changedDevice.difference
    }
  });

  // Obteniendo dispositivos nuevos
  const newDevices: any = changedDevices.map((changedDevice: any) => {
    const {isNew, deviceID, nombre, difference} = changedDevice;

    return isNew ? {
      _id: deviceID,
      nombre,
      localPrestado: difference,
    }: undefined;
  }).filter((item: any) => !!item);

  // Uniendo la lista de dispositivos ya filtrada con la lista de dispositivos nuevos
  const deviceListWithAllChanges: any = [...devicesWithChanges, ...newDevices];

  console.log('devices with changes');
  console.log(deviceListWithAllChanges);

  const result: DbServiceResponse = await updateOne(loanCollection, loanID, {$set: {dispositivos: deviceListWithAllChanges}});
  if (result.error) {
    return res.status(500).json({
      error: true,
      msg: "Error al modificar el préstamo en la base de datos",
    });
  }

  res.json({
    error: false,
    msg: 'Préstamo actualizado con éxito',
  });
}

export default {
  uploadLoan,
  getAllLoans,
  getActiveLoans,
  returnLoan,
  updateLoan,
}

export interface Horario {
  aula: string;
  horaInicio: number;
  horaFin: number;
  dia: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
}

export interface Alumno {
  _id?: string;
  matricula: string;
  nombre: string;
}

export interface Prestamo {
  _id?: string;
  observaciones?: string;
  status: "entrante" | "activo" | "deuda" | "inactivo";
  maestro: {
    _id: string;
    nombre: string;
  };
  materia: {
    _id: string;
    nombre: string;
    nrc: string;
    horario: Horario;
  };
  dispositivos: Dispositivo[];
  usuario: {
    _id: string;
    nickname: string;
  };
  timelog: {
    inicio: string;
    fin?: string;
  };
  alumno?: Alumno;
}
