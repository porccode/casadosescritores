"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { MessageSquare, Loader2, Calendar, Layout } from "lucide-react";

interface ProfileCommentsProps {
    profileId: string;
    isOwnProfile: boolean;
}

export default function ProfileComments({ profileId, isOwnProfile }: ProfileCommentsProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient();

    async function fetchComments() {
        setLoading(true);
        const { data } = await supabase
            .from("comments")
            .select(`
          id, 
          text, 
          created_at, 
          series (title), 
          chapters (title)
      `)
            .eq("author_id", profileId)
            .order("created_at", { ascending: false });

        if (data) {
            setComments(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchComments();
    }, [profileId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="space-y-6 animate-reveal fade-in duration-500">
            <h2 className="text-2xl font-bold text-foreground font-sans">Meus Comentários</h2>

            {loading ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <span className="font-medium">Carregando comentários...</span>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 animate-reveal fade-in duration-500 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                    <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-bold font-sans">Nenhum comentário realizado.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-background p-6 rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all hover:shadow-card-hover group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold tracking-widest">Publicado em</p>
                                        <h4 className="font-bold text-foreground text-sm line-clamp-1">
                                            {comment.series?.title || comment.chapters?.title || "Conteúdo"}
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold font-sans">
                                    <Calendar size={13} />
                                    {formatDate(comment.created_at)}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-5 rounded-xl border-l-4 border-primary/20 italic text-foreground text-sm font-medium leading-relaxed">
                                "{comment.text}"
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
