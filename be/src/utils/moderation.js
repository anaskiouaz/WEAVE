/**
 * Utilitaire de modération de contenu
 * Détecte et masque les messages contenant de la haine ou des insultes
 */

// Liste de mots/expressions à modérer (en français)
const BANNED_WORDS = [
    // Insultes courantes
    'connard', 'connasse', 'con', 'conne', 'salaud', 'salope', 'pute', 'putain',
    'enculé', 'enculer', 'nique', 'niquer', 'ntm', 'niktamère', 'fdp', 'fils de pute',
    'merde', 'emmerdeur', 'emmerdeuse', 'bordel', 'batard', 'bâtard',
    'couille', 'couilles', 'bite', 'bites', 'chier', 'chieur', 'chieuse',
    'abruti', 'abrutie', 'débile', 'crétin', 'crétine', 'imbécile', 'idiot', 'idiote',
    'taré', 'tarée', 'gogol', 'mongol', 'attardé', 'attardée',
    'clochard', 'clocharde', 'pouffiasse', 'grognasse', 'pétasse',
    'branleur', 'branleuse', 'branlette', 'enfoiré', 'enfoirée',
    'trou du cul', 'trouduc', 'bouffon', 'bouffonne',
    
    // Termes haineux / discriminatoires
    'nègre', 'négro', 'négresse', 'bougnoule', 'arabe de merde', 'sale arabe',
    'sale noir', 'sale blanc', 'sale juif', 'youpin', 'youtre', 'feuj',
    'pédé', 'pédale', 'tapette', 'tarlouze', 'gouine', 'lopette',
    'travelo', 'trans de merde', 'sale trans',
    'handicapé de merde', 'sale handicapé',
    'racaille', 'caillera', 'wesh', 'bicot', 'melon', 'bamboula',
    'chinetoque', 'bridé', 'bridée', 'ching chong',
    'nazi', 'hitler', 'sieg heil', 'heil',
    
    // Menaces et violence
    'je vais te tuer', 'je te tue', 'crève', 'va crever', 'suicide toi',
    'va te pendre', 'va te suicider', 'mort à', 'à mort',
    'je vais te frapper', 'je te frappe', 'je vais te défoncer',
    'terroriste', 'bombe', 'attaque',
    
    // Variantes avec leetspeak / contournements courants
    'c0n', 'c0nnard', 'c0nnasse', 'p0ute', 'put1', 'put@in',
    'n1que', 'm3rde', 'b1te', 'enc*lé', 'pd', 'tg', 'ta gueule', 'ferme ta gueule',
    'ftg', 'vte', 'vtff',
];

// Patterns regex pour détecter des variantes
const REGEX_PATTERNS = [
    /n+[i1!]+[qk]+[ue3]+/gi,           // nique et variantes
    /p+[u0]+t+[ea@]+[i1!]+n*/gi,       // putain et variantes
    /c+[o0]+n+[na]+[ra]+[rd]+/gi,      // connard/connasse
    /s+[a@]+l+[o0]+p+[e3]+/gi,         // salope
    /[e3]+n+c+[u0]+l+[é3e]+/gi,        // enculé
    /f+[i1]+l+s*\s*d+[e3]+\s*p+/gi,    // fils de p...
    /t+[a@]+\s*g+[ue3]+[u0]+l+[e3]+/gi, // ta gueule
];

/**
 * Vérifie si un texte contient du contenu inapproprié
 * @param {string} text - Le texte à vérifier
 * @returns {Object} { isInappropriate: boolean, reason: string|null }
 */
export function checkContent(text) {
    if (!text || typeof text !== 'string') {
        return { isInappropriate: false, reason: null };
    }

    const normalizedText = text.toLowerCase().trim();
    
    // Vérification des mots interdits (recherche simple)
    for (const word of BANNED_WORDS) {
        // Recherche simple du mot dans le texte
        if (normalizedText.includes(word.toLowerCase())) {
            console.log(`🛡️ Mot interdit détecté: "${word}" dans "${text}"`);
            return { 
                isInappropriate: true, 
                reason: 'Contenu inapproprié détecté'
            };
        }
    }
    
    // Vérification des patterns regex
    for (const pattern of REGEX_PATTERNS) {
        // Reset le lastIndex pour les regex globales
        pattern.lastIndex = 0;
        if (pattern.test(normalizedText)) {
            console.log(`🛡️ Pattern interdit détecté dans "${text}"`);
            return { 
                isInappropriate: true, 
                reason: 'Contenu inapproprié détecté'
            };
        }
    }

    return { isInappropriate: false, reason: null };
}

/**
 * Masque le contenu inapproprié d'un message
 * @param {string} text - Le texte original
 * @returns {Object} { text: string, wasModerated: boolean }
 */
export function moderateContent(text) {
    const check = checkContent(text);
    
    if (check.isInappropriate) {
        return {
            text: '⚠️ Ce message a été masqué car il contient du contenu inapproprié.',
            wasModerated: true,
            originalLength: text.length
        };
    }
    
    return {
        text: text,
        wasModerated: false
    };
}

/**
 * Vérifie et modère un message avant sauvegarde
 * Retourne le message modéré et un flag indiquant si une modération a eu lieu
 * @param {string} content - Le contenu du message
 * @returns {Object} { content: string, isModerated: boolean, moderationReason: string|null }
 */
export function moderateMessage(content) {
    const result = moderateContent(content);
    
    return {
        content: result.text,
        isModerated: result.wasModerated,
        moderationReason: result.wasModerated ? 'Contenu inapproprié' : null
    };
}

export default {
    checkContent,
    moderateContent,
    moderateMessage,
    BANNED_WORDS
};
