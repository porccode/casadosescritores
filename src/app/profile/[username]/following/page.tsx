import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ArrowLeft, Users } from "lucide-react";
import UserFollowButton from "@/components/UserFollowButton";
import UserAvatar from "@/components/UserAvatar";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    try {
        const supabase = await createServerSupabaseClient();
        const { data } = await (supabase
            .from("profiles")
            .select("username, first_name, last_name")
            .ilike("username", decodeURIComponent(username))
            .single() as any);

        if (!data) return { title: "Perfil não encontrado" };

        // Usar nome completo quando disponível, caso contrário usar nome de usuário
        const displayName = (data.first_name || data.last_name)
            ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
            : data.username;

        return {
            title: `${displayName} segue`,
            description: `Lista de pessoas que ${displayName} segue`,
        };
    } catch (error) {
        return { title: "Seguindo" };
    }
}

export default async function FollowingPage({ params }: Props) {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);

    try {
        const supabase = await createServerSupabaseClient();

        // Buscar perfil
        const { data: profile } = await (supabase
            .from("profiles")
            .select("*")
            .ilike("username", decodedUsername)
            .single() as any);

        if (!profile) return notFound();

        // Verificar sessão
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Buscar pessoas que o usuário segue
        const { data: following, error } = await (supabase as any)
            .from('follows')
            .select('following_id')
            .eq('follower_id', profile.id);

        if (error) {
            console.error("Erro ao buscar pessoas seguidas:", error.message, error.details, error.hint);
            return (
                <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-12">
                    <div className="bg-background rounded-3xl border border-border p-12 text-center shadow-premium">
                        <p className="text-sm text-destructive">Erro ao carregar pessoas seguidas.</p>
                        <p className="text-xs text-muted-foreground mt-3 font-medium">Por favor, tente novamente mais tarde.</p>
                    </div>
                </div>
            );
        }

        if (!following || following.length === 0) {
            return (
                <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-12">
                    <div className="mb-10">
                        <Link
                            href={`/profile/${username}`}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            <span>Perfil de {profile.username}</span>
                        </Link>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 flex items-center tracking-tight font-sans">
                        <Users size={32} className="mr-4 text-primary" />
                        Pessoas que {profile.username} segue
                    </h1>

                    <div className="bg-background rounded-3xl border border-border p-20 text-center shadow-premium">
                        <p className="text-muted-foreground font-medium">Este usuário ainda não segue ninguém.</p>
                    </div>
                </div>
            );
        }

        // Obter os perfis que são seguidos
        const followingIds = (following as any[]).map(f => f.following_id);
        const { data: followingProfiles, error: profilesError } = await (supabase as any)
            .from('profiles')
            .select('id, username, avatar_url, bio, first_name, last_name')
            .in('id', followingIds);

        if (profilesError) {
            console.error("Erro ao buscar perfis:", profilesError.message, profilesError.details, profilesError.hint);
            return (
                <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                    <div className="bg-card rounded-lg border border-border p-6">
                        <p>Erro ao carregar perfis.</p>
                        <p className="text-sm text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
                    </div>
                </div>
            );
        }

        // Para cada pessoa seguida, verificar se o usuário atual também os segue
        const followingWithStatus = await Promise.all(
            (followingProfiles as any[] || []).map(async (followingProfile: any) => {
                let isFollowing = false;

                if (currentUserId) {
                    // Se o usuário atual é o mesmo do perfil que estamos visualizando,
                    // a pessoa já está sendo seguida
                    if (currentUserId === profile.id) {
                        isFollowing = true;
                    } else {
                        const { data: followData } = await supabase
                            .from('follows')
                            .select('id')
                            .eq('follower_id', currentUserId)
                            .eq('following_id', followingProfile.id)
                            .maybeSingle();

                        isFollowing = !!followData;
                    }
                }

                return {
                    ...followingProfile,
                    isFollowing
                };
            })
        );

        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-12">
                <div className="mb-10">
                    <Link
                        href={`/profile/${username}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        <span>Perfil de {profile.username}</span>
                    </Link>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 flex items-center tracking-tight font-sans">
                    <Users size={32} className="mr-4 text-primary" />
                    Pessoas que {profile.username} segue
                </h1>

                <div className="bg-background rounded-3xl border border-border overflow-hidden shadow-premium">
                    {followingWithStatus.length === 0 ? (
                        <div className="p-20 text-center text-muted-foreground font-medium">
                            <p>Este usuário ainda não segue ninguém.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border/50">
                            {followingWithStatus.map((followingUser: any) => (
                                <li key={followingUser.id} className="p-6 hover:bg-muted/30 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <Link
                                            href={`/profile/${followingUser.username}`}
                                            className="flex items-center flex-grow"
                                        >
                                            {/* Avatar */}
                                            <UserAvatar
                                                src={followingUser.avatar_url}
                                                alt={followingUser.username}
                                                size={48}
                                                className="mr-3 sm:mr-4 flex-shrink-0"
                                            />

                                            {/* Informações do usuário */}
                                            <div className="min-w-0 flex-grow">
                                                {(followingUser.first_name || followingUser.last_name) ? (
                                                    <>
                                                        <div className="font-bold text-foreground tracking-tight text-lg truncate font-sans">
                                                            {`${followingUser.first_name || ''} ${followingUser.last_name || ''}`.trim()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">@{followingUser.username}</div>
                                                    </>
                                                ) : (
                                                    <div className="font-bold text-foreground tracking-tight text-lg truncate font-sans">{followingUser.username}</div>
                                                )}
                                                {followingUser.bio && (
                                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-2 font-medium">{followingUser.bio}</p>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Botão de seguir/deixar de seguir */}
                                        {currentUserId && currentUserId !== followingUser.id && (
                                            <div className="ml-0 sm:ml-4 self-start sm:self-center mt-2 sm:mt-0">
                                                <UserFollowButton
                                                    profileId={followingUser.id}
                                                    isFollowing={followingUser.isFollowing}
                                                    username={followingUser.username}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro na página de pessoas seguidas:", error);
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-12">
                <div className="bg-background rounded-3xl border border-border p-12 text-center shadow-premium">
                    <p className="text-sm text-destructive">Ocorreu um erro ao carregar esta página.</p>
                </div>
            </div>
        );
    }
}
