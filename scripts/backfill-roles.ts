/**
 * Script de Backfill para Normalização de Papéis (Roles)
 * 
 * Sincroniza o campo 'role' com a flag legada 'is_admin'.
 * Regra: Se is_admin = true, role deve ser 'admin'.
 *       Se role = 'admin', is_admin deve ser true.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillRoles() {
  console.log('🚀 Iniciando backfill de normalização de papéis...');

  // 1. Buscar todos os perfis
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, role, is_admin');

  if (error) {
    console.error('Erro ao buscar perfis:', error);
    return;
  }

  console.log(`Encontrados ${profiles.length} perfis para analisar.`);

  let updatedCount = 0;

  for (const profile of profiles) {
    let needsUpdate = false;
    let nextRole = profile.role;
    let nextIsAdmin = profile.is_admin;

    // Regra 1: Se is_admin é true, role DEVE ser admin
    if (profile.is_admin === true && profile.role !== 'admin') {
      nextRole = 'admin';
      needsUpdate = true;
      console.log(`[Sync] Usuário ${profile.username} (${profile.id}): is_admin=true -> role='admin'`);
    }

    // Regra 2: Se role é admin, is_admin DEVE ser true (retrocompatibilidade)
    if (profile.role === 'admin' && profile.is_admin !== true) {
      nextIsAdmin = true;
      needsUpdate = true;
      console.log(`[Sync] Usuário ${profile.username} (${profile.id}): role='admin' -> is_admin=true`);
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: nextRole, is_admin: nextIsAdmin })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Erro ao atualizar usuário ${profile.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Backfill concluído. ${updatedCount} perfis foram atualizados.`);
}

backfillRoles().catch(console.error);
