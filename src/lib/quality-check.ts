/**
 * Utilitários para verificar a qualidade de uma string de texto.
 * Focado em detectar "keyboard smashing", spams e nomes sem sentido.
 */

/**
 * Verifica se um texto parece ser "gibberish" (sem sentido).
 * Implementa heurísticas baseadas em proporção de vogais, clusters de consoantes e repetições.
 */
export function isGibberish(text: string): { isGibberish: boolean; reason?: string } {
    if (!text || text.length < 4) return { isGibberish: false };

    const cleanText = text.trim().toLowerCase();
    const length = cleanText.length;

    // 1. Verificar caracteres repetidos excessivamente (ex: aaaaaa)
    const repeatedChars = /(.)\1{4,}/;
    if (repeatedChars.test(cleanText)) {
        return { isGibberish: true, reason: "Muitos caracteres repetidos" };
    }

    // 2. Verificar proporção de vogais (em português/inglês, vogais são cruciais)
    // Se o texto for longo (> 6) e tiver quase nenhuma vogal, é suspeito.
    const vowels = cleanText.match(/[aeiouáéíóúâêîôûàèìòùãõ]/g) || [];
    const vowelRatio = vowels.length / length;

    if (length > 6 && vowelRatio < 0.12) {
        return { isGibberish: true, reason: "Proporção de vogais muito baixa (parece aleatório)" };
    }

    // 3. Verificar clusters de consoantes (consoantes seguidas sem vogais)
    // Sequências de 6 ou mais consoantes são raríssimas em nomes reais.
    const consonantClusters = /[bcdfghjklmnpqrstvwxyz]{6,}/i;
    if (consonantClusters.test(cleanText)) {
        return { isGibberish: true, reason: "Sequência de consoantes muito longa" };
    }

    // 4. Verificar "Keyboard Smashing" comum (sequências horizontais no teclado)
    const smashingPatterns = [
        'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 
        'qwert', 'werty', 'ertyu',
        'zxcv', 'xcvb', 'cvbn'
    ];
    if (smashingPatterns.some(p => cleanText.includes(p))) {
        return { isGibberish: true, reason: "Padrão de teclado detectado" };
    }

    // 5. Verificar palavras excessivamente longas sem espaços
    // (Útil para descrições)
    const words = cleanText.split(/\s+/);
    if (words.some(w => w.length > 25)) {
        return { isGibberish: true, reason: "Palavras excessivamente longas detectadas" };
    }

    return { isGibberish: false };
}
