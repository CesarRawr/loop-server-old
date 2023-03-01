import jwt, {SignOptions, JwtPayload} from 'jsonwebtoken';

const jwtExpirySeconds: number = 300;
const jwtOptions: SignOptions = {
  algorithm: "HS256",
};

export const createToken = (payload: JwtPayload): string => {
  const token: string = jwt.sign(payload, process.env.TOKEN as string, jwtOptions);
  return token;
};

export const verifyToken = (token: string): Payload | boolean => {
  let payload: Payload = null;
  try {
    payload = jwt.verify(token, process.env.TOKEN as string);
  } catch (e) {
    return false;
  }

  return payload;
};

export type Payload = JwtPayload | string | null;
