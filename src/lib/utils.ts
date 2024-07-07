/**
 * Utilitários para manipulação de dados e formatação
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for conditionally joining class names with Tailwind merge
 * @param inputs - List of class names or conditional class expressions
 * @returns Merged class string with Tailwind conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Classes base para o estilo de conteúdo (Prose)
 * Garante que o editor e o visualizador tenham a mesma aparência
 */
export const STORY_PROSE_CLASSES = cn(
  "prose prose-neutral dark:prose-invert max-w-none",
  "text-foreground font-sans prose-lg md:prose-xl",
  "prose-headings:scroll-m-20 prose-headings:tracking-tight prose-headings:font-bold prose-headings:mt-12 prose-headings:mb-6",
  "prose-p:leading-8 prose-p:my-6",
  "prose-blockquote:my-10 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:text-muted-foreground",
  "prose-ul:my-8 prose-ul:ml-6 prose-ul:list-disc",
  "prose-ol:my-8 prose-ol:ml-6 prose-ol:list-decimal",
  "prose-li:mt-4",
  "prose-img:rounded-2xl prose-img:my-0"
);

/**
 * Formata um número grande de forma compacta no estilo Wattpad.
 * Exemplos: 0 → "0", 999 → "999", 1200 → "1.2k", 45800 → "45.8k", 1000000 → "1M"
 * @param num - O número a ser formatado
 * @returns String formatada compacta
 */
export function formatCompactNumber(num: number | null | undefined): string {
  if (num == null || num === 0) return "0";
  if (num < 1_000) return String(num);
  if (num < 1_000_000) {
    const k = num / 1_000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  const m = num / 1_000_000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}

/**
 * Sanitiza uma string para uso em URLs (remove acentos, especiais, espaços)
 * @param text - O texto a ser sanitizado
 * @returns Slug limpo
 */
export function sanitizeSlug(text: string): string {
  if (!text) return "";

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-')     // Substituir espaços por hífens
    .replace(/-+/g, '-')      // Evitar hífens duplicados
    .slice(0, 100)            // Limitar o comprimento (aumentado para 100)
    .replace(/^-+|-+$/g, ''); // Remover hífens no início e fim
}

/**
 * Gera um slug a partir de um título, opcionalmente com ID
 * @param title - O título a ser transformado em slug
 * @param id - O ID a ser adicionado ao slug para unicidade (opcional se includeId for false)
 * @param includeId - Se deve incluir o ID no final (padrão: true)
 * @returns Slug formatado
 */
export function generateSlug(title: string, id: string | number, includeId: boolean = true): string {
  const slug = sanitizeSlug(title);
  const truncatedSlug = slug.slice(0, 50).replace(/-+$/g, '');
  const safeId = String(id);

  if (!title) return `id-${id}`;

  // Se não precisar de ID, retorna apenas o slug limpo
  if (!includeId) {
    return truncatedSlug;
  }

  // Comportamento padrão (com ID)
  // For IDs very long like UUIDs, we can leave as is
  if (!truncatedSlug) {
    return `id-${safeId}`;
  }

  return `${truncatedSlug}-${safeId}`;
}

/**
 * Retorna a URL completa de um arquivo no storage do Supabase,
 * ou a própria URL se ela já for completa (externa).
 * @param path - O caminho ou URL completa da imagem
 * @returns URL absoluta pronta para uso no component Image ou img
 */
export function getMediaUrl(path: string | null | undefined, bucket: 'covers' | 'avatars' = 'covers'): string {
  if (!path) return "";

  // Se for uma URL completa (começa com http), retorna ela mesma
  if (path.startsWith("http")) return path;

  // Se for um caminho relativo que já começa com a URL do Supabase (erro comum de persistência)
  // Ou se for apenas o caminho do arquivo, construir a URL completa
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return path;

  // Caso o caminho já seja um caminho de storage mas relativo
  if (!path.includes("storage/v1/object/public")) {
    const cleanPath = path.replace(/^\/+/, "");
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  }

  // Se já tiver a estrutura de storage mas for relativo ao domínio
  if (path.startsWith("/")) {
    return `${supabaseUrl}${path}`;
  }

  return path;
}

/**
 * Extrai o ID numérico ou UUID de um slug
 * @param slug - O slug a ser processado
 * @returns O ID extraído ou null se não encontrado
 */
export function extractIdFromSlug(slug: string | null): string | null {
  if (!slug) return null;

  // Verificar se o slug já é um UUID completo
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    return slug;
  }

  // Verificar se o slug já é um ID numérico simples
  if (/^\d+$/.test(slug)) {
    return slug;
  }

  // Procurar por UUID no slug (padrão exato do UUID)
  const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }

  // Tentar extrair ID numérico no final do slug (ex: titulo-da-obra-123)
  const numericMatch = slug.match(/-(\d+)$/);
  if (numericMatch) {
    return numericMatch[1];
  }

  // Se nada der certo, retornar null (ou o slug original se for um UUID/Número já tratado acima)
  return null;
}

/**
 * Formata a data em português
 * @param dateString - String de data ISO
 * @returns Data formatada
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Data desconhecida";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Data inválida";

  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calcula o tempo estimado de leitura
 * @param content - Conteúdo HTML
 * @returns Minutos de leitura
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 0;
  // Remover tags HTML e contar palavras
  const wordCount = content
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .length;

  // Assumir média de 200 palavras por minuto
  return Math.max(1, Math.round(wordCount / 200));
}

/**
 * Cria um resumo de texto a partir de conteúdo HTML
 * @param htmlContent - Conteúdo HTML
 * @param maxLength - Tamanho máximo do resumo
 * @returns Resumo em texto plano
 */
export const createSummary = (htmlContent: string | null | undefined, maxLength: number = 150): string => {
  if (!htmlContent) return "";

  let textContent = htmlContent;

  // Tentar fazer parse se parecer JSON
  if (htmlContent.trim().startsWith("{") || htmlContent.trim().startsWith("[")) {
    try {
      const jsonContent = JSON.parse(htmlContent);

      // Função recursiva para extrair texto de nós Tiptap/Prosemirror
      const extractTextFromNode = (node: any): string => {
        if (node.type === "text" && node.text) {
          return node.text;
        }
        if (node.content && Array.isArray(node.content)) {
          return node.content.map((child: any) => extractTextFromNode(child)).join(" ");
        }
        return "";
      };

      if (jsonContent.type === "doc" && jsonContent.content) {
        textContent = extractTextFromNode(jsonContent);
      }
    } catch (e) {
      // Se falhar o parse, assume que é texto/html normal
      // console.warn("Falha ao parsear conteúdo como JSON em createSummary", e);
    }
  }

  // Remover todas as tags HTML (caso seja HTML ou tenha restado algo)
  textContent = textContent.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  // Limitar o tamanho e adicionar reticências se necessário
  if (textContent.length <= maxLength) {
    return textContent;
  }

  // Cortar no final de uma palavra
  let summary = textContent.substring(0, maxLength);
  const lastSpace = summary.lastIndexOf(" ");
  if (lastSpace > 0) {
    summary = summary.substring(0, lastSpace);
  }
  return `${summary}...`;
};

/**
 * Garante que a primeira letra da string seja maiúscula (Sentence Case),
 * sem alterar o restante do conteúdo.
 * @param text - O texto a ser formatado
 * @returns Texto formatado
 */
export function capitalizeSentence(text: string | null | undefined): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Formata um título preservando o seu conteúdo original,
 * apenas garantindo que não esteja vazio. Antigamente forçava Title Case.
 * @param title - O título a ser processado
 * @returns Título processado
 */
export function formatTitle(title: string | null | undefined): string {
  if (!title) return "";
  // Return trimmed title, preserving user's original capitalization
  return title.trim();
}
/**
 * Formata uma data para o formato "há X tempo"
 * @param date - Objeto Date
 * @returns String formatada
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `agora há pouco`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`;
}

/**
 * Verifica se uma série é considerada "Abandonada"
 * Regra: Tem capítulos (chapter_count > 0), não está concluída e não é atualizada há > 15 dias
 * @param chapterCount - O número de capítulos publicados
 * @param updatedAt - A data da última atualização (ISO)
 * @param isCompleted - Se a série já foi marcada como concluída
 * @returns boolean
 */
export function isSeriesAbandoned(
  chapterCount: number | null | undefined, 
  updatedAt: string | null | undefined,
  isCompleted?: boolean,
  isArchived?: boolean
): boolean {
  // Se estiver concluída ou arquivada, não é considerada "abandonada" no UI principal
  if (isCompleted || isArchived) return false;
  
  if (!chapterCount || chapterCount === 0 || !updatedAt) return false;
  
  const updatedDate = new Date(updatedAt).getTime();
  const now = new Date().getTime();
  const diffDays = (now - updatedDate) / (1000 * 60 * 60 * 24);
  
  // Consideramos abandonada se não houver atualização por mais de 15 dias
  return diffDays > 15;
}
/**
 * Formata data e hora em português
 * @param dateString - String de data ISO
 * @returns Data e hora formatada
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "Data desconhecida";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Data inválida";

  const datePart = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const timePart = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${datePart} às ${timePart}`;
}

/**
 * Comprime uma imagem no lado do cliente usando Canvas.
 * Reduz as dimensões se necessário e converte para WebP (prioridade) ou JPEG com qualidade ajustada.
 * @param file - O arquivo original
 * @param maxWidth - Largura máxima desejada (default 1200)
 * @param quality - Qualidade da compressão (0 a 1, default 0.8)
 * @param maxHeight - Altura máxima desejada (opcional)
 * @returns Promise com o arquivo comprimido
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.75,
  maxHeight?: number
): Promise<File> {
  // Se não for imagem, retorna o original
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo o aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Configurar para melhor qualidade de scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Tentar WebP primeiro (melhor compressão)
        const outputType = 'image/webp';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Se o WebP ficar maior que o original (raro mas possível em imagens pequenas),
            // ou se quisermos garantir que resolvemos com o nome original
            const finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: outputType,
              lastModified: Date.now(),
            });

            // Verificação básica: se a compressão não ajudou muito e o arquivo original era pequeno, 
            // poderíamos retornar o original, mas para padronizar o storage, o WebP é melhor.
            resolve(finalFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Gera um slug SEO-friendly simples (sem ID) a partir de um texto.
 * Usado para categorias e outros recursos que não precisam de ID no slug.
 */
export function generateSimpleSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
}

