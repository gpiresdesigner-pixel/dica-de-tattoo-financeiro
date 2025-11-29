
export const generateUUID = (): string => {
  // Tenta usar a API nativa de criptografia se disponível
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback se falhar
    }
  }
  
  // Fallback seguro para timestamp + random
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
