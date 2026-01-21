// Utilitaire pour combiner les classes (à mettre dans utils/styleUtils.js si n'existe pas)
export const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
 };