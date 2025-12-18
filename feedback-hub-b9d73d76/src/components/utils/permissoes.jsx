/**
 * Utilitário para gerenciar permissões e acessos setoriais
 */

// Lista de emails com acesso global irrestrito
const ADMIN_GLOBAL_EMAILS = [
    'mfo.oliveira0013@gmail.com',      // Maurício - Tecnologia
    'edielwinicius@nefadv.com.br',     // Ediel - RH
    'gabrielcarvalho@nefadv.com.br',   // Gabriel - ADM Geral
    'juliogoncalves@nefadv.com.br'     // Julio - ADM (sem delete)
];

// Admins que podem excluir usuários e avaliações
const ADMIN_CAN_DELETE = [
    'mfo.oliveira0013@gmail.com',
    'edielwinicius@nefadv.com.br',
    'gabrielcarvalho@nefadv.com.br'
];

// Administradores com acesso a múltiplos setores específicos
const ADMIN_MULTI_SETOR = {
    'juliogoncalves@nefadv.com.br': ['Extra', 'M.I.S', 'Controldesk'],
    'viniciusaraujo@nefadv.com.br': ['Controladoria', 'Focais']
};

// Usuários com permissão especial para enviar rascunhos do próprio setor (mantido para compatibilidade)
const CAN_SEND_DRAFTS_OWN_SECTOR = [
    'brunalopes@nefadv.com.br',
    'alexandre.santos@extranef.com.br',
    'marynasilva@nefadv.com.br',
    'daniellefonseca@nefadv.com.br'
];

// Gestores que têm acesso a todos os setores (lista vazia = todos são gestores comuns)
const GESTORES_ACESSO_TODOS_SETORES = [];

/**
 * Verifica se o gestor tem acesso a todos os setores
 * @param {Object} user - Objeto do usuário logado
 * @returns {boolean}
 */
export const isGestorAcessoTodosSetores = (user) => {
    if (!user) return false;
    return user.cargo === 'gestor' && GESTORES_ACESSO_TODOS_SETORES.includes(user.email);
};

/**
 * Verifica se o usuário é um Administrador Global (sem restrição de setor)
 * @param {Object} user - Objeto do usuário logado
 * @returns {boolean}
 */
export const isAdminGlobal = (user) => {
    if (!user) return false;
    
    // EXCEÇÃO ESPECIAL: Usuários específicos sempre têm acesso global
    if (ADMIN_GLOBAL_EMAILS.includes(user.email)) {
        return user.cargo === 'administrador';
    }
    
    // Admin Global = cargo "administrador" E setor vazio/null
    return user.cargo === 'administrador' && (!user.setor || user.setor === '');
};

/**
 * Verifica se o usuário pode excluir dados (usuários e avaliações)
 * @param {Object} user - Objeto do usuário logado
 * @returns {boolean}
 */
export const canDelete = (user) => {
    if (!user) return false;
    return ADMIN_CAN_DELETE.includes(user.email);
};

/**
 * Verifica se o usuário é um Administrador Multi-Setorial (acesso a múltiplos setores específicos)
 * @param {Object} user - Objeto do usuário logado
 * @returns {boolean}
 */
export const isAdminMultiSetor = (user) => {
    if (!user) return false;
    return user.cargo === 'administrador' && ADMIN_MULTI_SETOR.hasOwnProperty(user.email);
};

/**
 * Retorna os setores que um administrador multi-setorial pode acessar
 * @param {Object} user - Objeto do usuário logado
 * @returns {Array<string>}
 */
export const getAdminSetores = (user) => {
    if (!user) return [];
    if (isAdminGlobal(user)) return []; // Vazio = todos os setores
    if (isAdminMultiSetor(user)) return ADMIN_MULTI_SETOR[user.email];
    if (user.setor) return [user.setor];
    return [];
};

/**
 * Verifica se o usuário é um Administrador Setorial (restrito ao seu setor)
 * @param {Object} user - Objeto do usuário logado
 * @returns {boolean}
 */
export const isAdminSetorial = (user) => {
    if (!user) return false;
    
    // EXCEÇÃO: Usuários com acesso global ou multi-setorial nunca são considerados Admin Setorial
    if (ADMIN_GLOBAL_EMAILS.includes(user.email)) {
        return false;
    }
    
    if (isAdminMultiSetor(user)) {
        return false;
    }
    
    // Admin Setorial = cargo "administrador" E tem setor definido
    return user.cargo === 'administrador' && user.setor && user.setor !== '';
};

/**
 * Verifica se o usuário pode ver seus próprios rascunhos
 * @param {Object} user - Usuário logado
 * @returns {boolean}
 */
export const canViewOwnDrafts = (user) => {
    if (!user) return false;
    
    // Administradores e gestores sempre podem ver seus rascunhos
    if (user.cargo === 'administrador' || user.cargo === 'gestor') return true;
    
    // Usuários com permissão especial também podem
    if (CAN_SEND_DRAFTS_OWN_SECTOR.includes(user.email)) return true;
    
    return false;
};

/**
 * Verifica se o usuário pode enviar rascunhos de avaliações
 * NOVA REGRA: Todos os gestores e administradores podem enviar rascunhos do próprio setor
 * @param {Object} currentUser - Usuário logado
 * @param {Object} avaliacao - Avaliação em questão
 * @param {Array} allUsers - Lista de todos os usuários
 * @returns {boolean}
 */
export const canSendDrafts = (currentUser, avaliacao, allUsers = []) => {
    if (!currentUser || !avaliacao) return false;
    
    // Admin Global: pode enviar qualquer rascunho
    if (isAdminGlobal(currentUser)) return true;
    
    const userMap = new Map(allUsers.map(u => [u.email, u]));
    const destinatario = userMap.get(avaliacao.destinatario_email);
    
    // Todos os Administradores (setoriais e multi-setoriais) podem enviar rascunhos do próprio setor
    if (currentUser.cargo === 'administrador') {
        // Admin Multi-Setorial: pode enviar rascunhos dos setores permitidos
        if (isAdminMultiSetor(currentUser)) {
            const setoresPermitidos = ADMIN_MULTI_SETOR[currentUser.email];
            return setoresPermitidos.includes(destinatario?.setor);
        }
        // Admin Setorial: pode enviar rascunhos do próprio setor
        if (isAdminSetorial(currentUser)) {
            return destinatario?.setor === currentUser.setor;
        }
    }
    
    // Todos os Gestores podem enviar rascunhos de avaliações do próprio setor
    if (currentUser.cargo === 'gestor') {
        // Gestor com acesso a todos os setores
        if (isGestorAcessoTodosSetores(currentUser)) {
            // Verifica se o destinatário está na equipe do gestor
            return destinatario?.gestores_responsaveis?.includes(currentUser.email);
        }
        // Gestor normal: pode enviar rascunhos do próprio setor
        return destinatario?.setor === currentUser.setor;
    }
    
    // Usuários com permissão especial (mantido para compatibilidade)
    if (CAN_SEND_DRAFTS_OWN_SECTOR.includes(currentUser.email)) {
        return destinatario?.setor === currentUser.setor;
    }
    
    return false;
};

/**
 * Verifica se o usuário pode acessar/editar uma avaliação específica
 * @param {Object} currentUser - Usuário logado
 * @param {Object} avaliacao - Avaliação em questão
 * @param {Array} allUsers - Lista de todos os usuários
 * @returns {boolean}
 */
export const canAccessAvaliacao = (currentUser, avaliacao, allUsers = []) => {
    if (!currentUser || !avaliacao) return false;
    
    // Admin Global: acesso total
    if (isAdminGlobal(currentUser)) return true;
    
    // Se for rascunho, verifica se é o criador
    if (avaliacao.status_avaliacao === 'Rascunho') {
        // Criador do rascunho sempre pode acessar
        if (avaliacao.remetente_email === currentUser.email) return true;
        
        // Admin Global pode acessar qualquer rascunho
        if (isAdminGlobal(currentUser)) return true;
        
        // Outros não podem acessar rascunhos de terceiros
        return false;
    }
    
    const userMap = new Map(allUsers.map(u => [u.email, u]));
    const destinatario = userMap.get(avaliacao.destinatario_email);
    
    // Admin Multi-Setorial: acesso aos setores permitidos
    if (isAdminMultiSetor(currentUser)) {
        const setoresPermitidos = ADMIN_MULTI_SETOR[currentUser.email];
        return setoresPermitidos.includes(destinatario?.setor);
    }
    
    // Admin Setorial: apenas do mesmo setor
    if (isAdminSetorial(currentUser)) {
        return currentUser.setor === destinatario?.setor;
    }
    
    // Gestor: apenas avaliações da sua equipe ou enviadas
    if (currentUser.cargo === 'gestor') {
        if (isGestorAcessoTodosSetores(currentUser)) {
            return destinatario?.gestores_responsaveis?.includes(currentUser.email) ||
                   avaliacao.remetente_email === currentUser.email;
        }
        return destinatario?.setor === currentUser.setor ||
               avaliacao.remetente_email === currentUser.email;
    }
    
    // Usuário: apenas se for destinatário ou remetente
    return avaliacao.destinatario_email === currentUser.email ||
           avaliacao.remetente_email === currentUser.email;
};

/**
 * Verifica se o usuário pode acessar dados de outro usuário
 * @param {Object} currentUser - Usuário logado
 * @param {Object} targetUser - Usuário alvo
 * @returns {boolean}
 */
export const canAccessUser = (currentUser, targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    // Admin Global: acesso total
    if (isAdminGlobal(currentUser)) return true;
    
    // Admin Multi-Setorial: acesso aos setores permitidos
    if (isAdminMultiSetor(currentUser)) {
        const setoresPermitidos = ADMIN_MULTI_SETOR[currentUser.email];
        return setoresPermitidos.includes(targetUser.setor);
    }
    
    // Admin Setorial: apenas do mesmo setor
    if (isAdminSetorial(currentUser)) {
        return currentUser.setor === targetUser.setor;
    }
    
    // Gestor: apenas sua equipe
    if (currentUser.cargo === 'gestor') {
        return targetUser.gestores_responsaveis?.includes(currentUser.email) || 
               targetUser.email === currentUser.email;
    }
    
    // Usuário: apenas ele mesmo
    return currentUser.email === targetUser.email;
};

/**
 * Filtra lista de usuários baseado nas permissões do usuário logado
 * @param {Array} users - Lista de usuários
 * @param {Object} currentUser - Usuário logado
 * @returns {Array}
 */
export const filterUsersByPermission = (users, currentUser) => {
    if (!currentUser || !users) return [];
    
    // Admin Global: vê todos
    if (isAdminGlobal(currentUser)) return users;
    
    // Admin Multi-Setorial: apenas dos setores permitidos
    if (isAdminMultiSetor(currentUser)) {
        const setoresPermitidos = ADMIN_MULTI_SETOR[currentUser.email];
        return users.filter(u => setoresPermitidos.includes(u.setor));
    }
    
    // Admin Setorial: apenas do mesmo setor
    if (isAdminSetorial(currentUser)) {
        return users.filter(u => u.setor === currentUser.setor);
    }
    
    // Gestor com acesso a todos os setores: apenas sua equipe (de qualquer setor)
    if (isGestorAcessoTodosSetores(currentUser)) {
        return users.filter(u => 
            u.gestores_responsaveis?.includes(currentUser.email) || 
            u.email === currentUser.email
        );
    }
    
    // Gestor: apenas sua equipe
    if (currentUser.cargo === 'gestor') {
        return users.filter(u => 
            u.gestores_responsaveis?.includes(currentUser.email) || 
            u.email === currentUser.email
        );
    }
    
    // Usuário: apenas ele mesmo
    return users.filter(u => u.email === currentUser.email);
};

/**
 * Filtra lista de feedbacks baseado nas permissões do usuário logado
 * @param {Array} feedbacks - Lista de feedbacks
 * @param {Object} currentUser - Usuário logado
 * @param {Array} allUsers - Lista de todos os usuários (para verificar setores)
 * @returns {Array}
 */
export const filterFeedbacksByPermission = (feedbacks, currentUser, allUsers = []) => {
    if (!currentUser || !feedbacks) return [];
    
    // Admin Global: vê todos
    if (isAdminGlobal(currentUser)) return feedbacks;
    
    const userMap = new Map(allUsers.map(u => [u.email, u]));
    
    // Admin Multi-Setorial: apenas feedbacks dos setores permitidos
    if (isAdminMultiSetor(currentUser)) {
        const setoresPermitidos = ADMIN_MULTI_SETOR[currentUser.email];
        return feedbacks.filter(f => {
            const destinatario = userMap.get(f.destinatario_email);
            const remetente = userMap.get(f.remetente_email);
            return setoresPermitidos.includes(destinatario?.setor) || 
                   setoresPermitidos.includes(remetente?.setor);
        });
    }
    
    // Admin Setorial: apenas feedbacks do seu setor
    if (isAdminSetorial(currentUser)) {
        return feedbacks.filter(f => {
            const destinatario = userMap.get(f.destinatario_email);
            const remetente = userMap.get(f.remetente_email);
            return destinatario?.setor === currentUser.setor || 
                   remetente?.setor === currentUser.setor;
        });
    }
    
    // Gestor com acesso a todos os setores: feedbacks da sua equipe (de qualquer setor)
    if (isGestorAcessoTodosSetores(currentUser)) {
        const teamEmails = allUsers
            .filter(u => u.gestores_responsaveis?.includes(currentUser.email) || u.email === currentUser.email)
            .map(u => u.email);
        return feedbacks.filter(f => 
            teamEmails.includes(f.destinatario_email) || 
            teamEmails.includes(f.remetente_email)
        );
    }
    
    // Gestor: feedbacks da sua equipe
    if (currentUser.cargo === 'gestor') {
        const teamEmails = allUsers
            .filter(u => u.gestores_responsaveis?.includes(currentUser.email) || u.email === currentUser.email)
            .map(u => u.email);
        return feedbacks.filter(f => 
            teamEmails.includes(f.destinatario_email) || 
            teamEmails.includes(f.remetente_email)
        );
    }
    
    // Usuário: apenas seus feedbacks
    return feedbacks.filter(f => 
        f.destinatario_email === currentUser.email || 
        f.remetente_email === currentUser.email
    );
};

/**
 * Filtra avaliações incluindo rascunhos do próprio usuário
 * @param {Array} avaliacoes - Lista de avaliações
 * @param {Object} currentUser - Usuário logado
 * @param {Array} allUsers - Lista de todos os usuários
 * @returns {Array}
 */
export const filterAvaliacoesWithDrafts = (avaliacoes, currentUser, allUsers = []) => {
    if (!currentUser || !avaliacoes) return [];
    
    return avaliacoes.filter(avaliacao => {
        // Rascunhos: apenas o criador ou admin global pode ver
        if (avaliacao.status_avaliacao === 'Rascunho') {
            return avaliacao.remetente_email === currentUser.email || isAdminGlobal(currentUser);
        }
        
        // Avaliações enviadas: usa o filtro normal de permissões
        return canAccessAvaliacao(currentUser, avaliacao, allUsers);
    });
};

/**
 * Retorna o título apropriado baseado no tipo de admin
 * @param {Object} user - Usuário logado
 * @returns {string}
 */
export const getAdminTitle = (user) => {
    if (!user) return '';
    
    if (isAdminGlobal(user)) return 'Todos os Usuários';
    if (isAdminMultiSetor(user)) {
        const setores = ADMIN_MULTI_SETOR[user.email];
        return `Usuários dos Setores: ${setores.join(', ')}`;
    }
    if (isAdminSetorial(user)) return `Usuários do Setor ${user.setor}`;
    if (user.cargo === 'gestor') return 'Minha Equipe';
    return 'Meu Perfil';
};