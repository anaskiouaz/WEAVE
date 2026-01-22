import { apiGet } from '../api/client';

/**
 * Fonction utilitaire pour récupérer le nombre de messages non lus
 * depuis le backend
 */
export const fetchUnreadMessagesCount = async (circleId = null) => {
  try {
    const endpoint = circleId ? `/dashboard?circle_id=${circleId}` : '/dashboard';
    const response = await apiGet(endpoint);
    
    if (response.data && response.data.stats && response.data.stats.unread_messages !== undefined) {
      return response.data.stats.unread_messages;
    }
    return 0;
  } catch (error) {
    console.error("Erreur lors de la récupération des messages non lus:", error);
    return 0;
  }
};
