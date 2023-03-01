export const checkStrings = (data: string[]): boolean => {
  // Detectar los que no son strings
  const notStrings: string[] = data.filter((cadena: string) => typeof cadena !== 'string');
  if (notStrings.length) {
    return false;
  }

  // Detectar los que estan vacios
  const emptyValues = data.filter((cadena: string) => cadena === '');
  if (emptyValues.length) {
    return false;
  }

  return true;
}
