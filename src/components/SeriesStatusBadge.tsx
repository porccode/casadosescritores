"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SeriesStatusBadgeProps {
  isCompleted?: boolean;
  isExplicit?: boolean;
  isArchived?: boolean;
  isDraft?: boolean;
  genre?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Status and Category badge component using shadcn Badge variants.
 * Uses semantic color tokens: success, neutral, explicit.
 */
export default function SeriesStatusBadge({
  isCompleted,
  isExplicit,
  isArchived,
  isDraft,
  genre,
  size = "sm",
  className = "",
}: SeriesStatusBadgeProps): React.ReactElement {
  const sizeClasses = {
    sm: "text-xs px-2.5 py-0.5",
    md: "text-sm px-3 py-0.5",
    lg: "text-base px-4 py-1",
  };

  if (isDraft) {
    return (
      <Badge
        variant="secondary"
        className={cn("bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200", sizeClasses[size], className)}
      >
        Rascunho
      </Badge>
    );
  }

  if (isArchived) {
    return (
      <Badge
        variant="secondary"
        className={cn("bg-muted text-muted-foreground hover:bg-muted/80", sizeClasses[size], className)}
      >
        Arquivada
      </Badge>
    );
  }

  if (isExplicit) {
    return (
      <Badge
        variant="destructive"
        className={cn(sizeClasses[size], className)}
      >
        Conteúdo Explícito
      </Badge>
    );
  }

  if (genre) {
    return (
      <Badge
        variant="outline"
        className={cn("font-medium capitalize", sizeClasses[size], className)}
      >
        {genre}
      </Badge>
    );
  }

  if (isCompleted) {
    return (
      <Badge
        variant="default"
        className={cn("bg-green-600 hover:bg-green-700 border-transparent", sizeClasses[size], className)}
      >
        Completa
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", sizeClasses[size], className)}
    >
      Em andamento
    </Badge>
  );
}
