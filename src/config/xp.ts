export const XP_CONFIG = {
    // Reader Interaction
    POST_LIKE: { action: "Curtir post", xp: 2, type: "reader", description: "Curtir posts no feed de novidades", serverSide: true },
    COMMENT_VOTE: { action: "Curtir comentário", xp: 2, type: "reader", description: "Dar joinha em discussões", serverSide: true },
    COMMENT_PUBLISH: { action: "Publicar comentário", xp: 15, type: "reader", description: "Participar das discussões (Peso Alto)", serverSide: true },
    READ_CHAPTER: { action: "Ler capítulo completo", xp: 10, type: "reader", description: "Progresso de leitura", serverSide: false },
    CONTENT_SAVE: { action: "Salvar capítulo", xp: 10, type: "reader", description: "Adicionar à biblioteca pessoal", serverSide: true },
    PLAYLIST_CREATE: { action: "Criar playlist", xp: 10, type: "reader", description: "Organizar conteúdos", serverSide: true },
    FOLLOW_USER: { action: "Seguir autor", xp: 5, type: "reader", description: "Acompanhar novos talentos", serverSide: true },

    // Social Extra
    POST_REPOST: { action: "Repostar publicação", xp: 10, type: "reader", description: "Impulsionar posts e ideias no feed", serverSide: true },
    SEARCH_PERFORM: { action: "Realizar busca", xp: 2, type: "reader", description: "Explorar novos horizontes", serverSide: true },
    NOTIFICATION_CLICK: { action: "Ver notificação", xp: 2, type: "reader", description: "Ficar por dentro das novidades", serverSide: true },
    MESSAGE_SEND: { action: "Mandar msg", xp: 2, type: "reader", description: "Trocar ideia com a comunidade", serverSide: true },
    MESSAGE_SEND_FIRST: { action: "Primeira msg", xp: 20, type: "reader", description: "Conectar-se com um novo autor", serverSide: true },

    // Writer Interaction (Gastos e Bônus)
    POST_PUBLISH: { action: "Publicar post", xp: 5, type: "writer", description: "Cada post publicado no feed", serverSide: true },
    SERIES_CREATE: { action: "Criar série", xp: -500, type: "writer", description: "Custo para criar uma nova série/obra", serverSide: true },
    COMMUNITY_CREATE: { action: "Criar comunidade", xp: -300, type: "reader", description: "Custo para criar uma nova comunidade", serverSide: true },
    CHAPTER_PUBLISH: { action: "Publicar capítulo", xp: -50, type: "writer", description: "Custo para publicar um capítulo novo", serverSide: true },
    FIRST_BOOK_CHAPTER: { action: "Publicar capítulo do primeiro livro", xp: 35, type: "writer", description: "Bônus ao publicar capítulo no livro de estreia (gratuito)", serverSide: true },
    AUTHOR_VIEW_EARNED: { action: "Visualização recebida", xp: 2, type: "writer", description: "XP ganho por visualização de leitor", serverSide: true },
    AUTHOR_COMMENT_EARNED: { action: "Comentário recebido na série", xp: 5, type: "writer", description: "XP ganho quando alguém comenta na sua série", serverSide: true },
    
    WORK_FINISH: { action: "Finalizar série", xp: 200, type: "writer", description: "Concluir a história (Bônus Máximo)", serverSide: true },
    CONSISTENT_POSTING: { action: "Frequência Semanal", xp: 80, type: "writer", description: "Postar 3+ capítulos em uma semana", serverSide: true },
    SERIES_EDIT: { action: "Editar série", xp: 2, type: "writer", description: "Manter obra atualizada", serverSide: true },
    CHAPTER_EDIT: { action: "Editar capítulo", xp: 2, type: "writer", description: "Refinar o conteúdo", serverSide: true },

    // Content Discovery (First Time)
    SERIES_READ_FIRST: { action: "Descobrir série", xp: 20, type: "reader", description: "Ler uma obra nova pela primeira vez", serverSide: true },
    CHAPTER_READ_FIRST: { action: "Primeiro capítulo", xp: 10, type: "reader", description: "Bônus por iniciar a leitura", serverSide: true },
    COMMENT_FIRST_IN_SERIES: { action: "Primeiro feedback", xp: 25, type: "reader", description: "Quebrar o gelo em uma nova série", serverSide: true },

    // Profile & General
    PROFILE_COMPLETE: { action: "Perfil completo", xp: 50, type: "reader", description: "Preencher todos os dados do perfil", serverSide: true },
    PROFILE_EDIT: { action: "Editar perfil", xp: 2, type: "reader", description: "Manter dados atualizados", serverSide: true },
    AVATAR_ADD: { action: "Adicionar foto de perfil", xp: 10, type: "reader", description: "Personalizar sua identidade", serverSide: true },
    BIO_UPDATE: { action: "Atualizar bio", xp: 5, type: "reader", description: "Contar sua história", serverSide: true },
    SOCIAL_UPDATE: { action: "Atualizar redes sociais", xp: 5, type: "reader", description: "Conectar suas redes", serverSide: true },
    RETURN_INACTIVITY: { action: "Retornar após inatividade", xp: 20, type: "reader", description: "Bônus de boas-vindas", serverSide: true },
    CONTENT_DELETE: { action: "Excluir conteúdo", xp: -10, type: "reader", description: "Penalidade por remoção", serverSide: true },
    PLAYLIST_ADD: { action: "Adicionar à playlist", xp: 2, type: "reader", description: "Curadoria de conteúdo", serverSide: true },
} as const;

export const XP_METHODS = Object.values(XP_CONFIG).sort((a, b) => b.xp - a.xp);

export type XPActionType = keyof typeof XP_CONFIG;
