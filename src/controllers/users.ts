import {Collection} from 'mongodb';
import {Request, Response} from 'express';
import {db} from '../utils/databaseConnection.js';
import type {Usuario} from '../models/types';
import {checkStrings} from '../utils/validations.js';
import {getOne, DbServiceResponse} from '../services/dbServices.js';
import {verifyToken, createToken, Payload} from '../services/jwtServices.js';

export const userCollection: Collection = db.collection('usuarios');

const login = async (req: Request, res: Response) => {
  const {nickname, pass}: Usuario = req.body;
  if (!checkStrings([nickname, pass])) {
    return res.status(401).json({
      msg: 'Contraseña y/o usuario incorrectos',
    });
  }

  const result: DbServiceResponse = await getOne(userCollection, {nickname});
  if (result.error) {
    return res.status(500).json({
      msg: 'Error al conectar con la base de datos',
    });
  }

  const user: Usuario | null = result.data;
  if (!user || pass !== user.pass) {
    return res.status(401).json({
      msg: 'Contraseña y/o usuario incorrectos',
    });
  }

  const token: string = createToken({
    _id: user._id,
    nickname: user.nickname,
    rol: user.rol,
  });

  res.json({
    token,
  });
}

export default {
  login,
}
