// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// GET: Buscar todas as categorias
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Using any for the select to avoid strict typing issues with generated types if they are not perfectly aligned
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) throw error;
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

// POST: Criar nova categoria (Admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verificar autenticação e permissão de admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { data: profile } = await (supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as any);
      
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }
    
    // Ler corpo da requisição
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    
    // Gerar slug
    const slug = name.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    // Inserir
    const { data, error } = await (supabase
      .from('categories' as any)
      .insert({ name, slug, description } as any)
      .select()
      .single() as any);
      
    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Categoria já existe' }, { status: 409 });
      }
      throw error;
    }
    
    return NextResponse.json({ category: data, message: 'Categoria criada com sucesso' });
    
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro interno ao criar categoria' }, { status: 500 });
  }
}

// DELETE: Remover categoria (Admin)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verificar auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const { data: profile } = await (supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as any);
      
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    
    const { error } = await (supabase
      .from('categories' as any)
      .delete()
      .eq('id', id) as any);
      
    if (error) throw error;
    
    return NextResponse.json({ message: 'Categoria excluída com sucesso' });
    
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
