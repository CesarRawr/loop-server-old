import jwt from 'jsonwebtoken';
import {Usuario} from '../models/types';
import {Request, Response, NextFunction} from 'express';
import {verifyToken, Payload} from '../services/jwtServices.js';

// Revisa si el token es valido
export const authenticateToken = (req: RequestMod, res: Response, next: NextFunction) => {
  const authHeader: any = req.headers['authorization'];
  const token: any = authHeader && authHeader.split(' ')[1];

  if (token === null) return res.sendStatus(401)

  const user: Payload | boolean = verifyToken(token);
  if (!user) return res.sendStatus(403);

  req.user = user;
  next();
}

// Revisa si el usuario tiene los permisos para acceder. accessLevel Es el rol que debe tener para acceder
export const hasAccessLevel = (accessLevel: AccessLevel[] = []) => {
  return (req: RequestMod, res: Response, next: NextFunction) => {
    if (!req.user) return res.sendStatus(403);
    const {rol} = req.user as Usuario;

    let hasAccess = accessLevel.includes(rol);
    if (!hasAccess) return res.sendStatus(401);

    next();
  }
}

// Alias
export type AccessLevel = "admin" | "common";

// Interfaces
export interface RequestMod extends Request {
  user?: Payload | boolean;
}