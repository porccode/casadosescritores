"use client";

import React from "react";
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationProps {
  /** Página atual (1-indexed) */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** URL base para os links de paginação (opcional se onPageChange for fornecido) */
  baseUrl?: string;
  /** Callback para mudança de página (opcional, para paginação client-side) */
  onPageChange?: (page: number) => void;
}

type PageItem = number | "...";

/**
 * Componente de paginação padronizado usando Shadcn UI.
 */
export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  onPageChange,
}: PaginationProps): React.ReactElement {
  // Gerar um array de números de página para exibir
  const getPageNumbers = (): PageItem[] => {
    const delta = 2;
    const pages: PageItem[] = [];

    pages.push(1);

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    if (rangeStart > 2) {
      pages.push("...");
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const getUrl = (p: number) => {
    if (onPageChange) return "#";
    if (!baseUrl) return `?page=${p}`;

    const hasQuery = baseUrl.includes("?");
    return `${baseUrl}${hasQuery ? "&" : "?"}page=${p}`;
  };

  const handlePageClick = (e: React.MouseEvent, p: number) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(p);
    }
  };

  return (
    <ShadcnPagination>
      <PaginationContent>
        <PaginationItem>
          {currentPage > 1 ? (
            <PaginationPrevious
              href={getUrl(currentPage - 1)}
              onClick={(e) => handlePageClick(e, currentPage - 1)}
            />
          ) : (
            <div className="pointer-events-none opacity-50">
              <PaginationPrevious href="#" />
            </div>
          )}
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={page === "..." ? `ellipsis-${index}` : page}>
            {page === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={getUrl(page)}
                isActive={currentPage === page}
                onClick={(e) => handlePageClick(e, page)}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          {currentPage < totalPages ? (
            <PaginationNext
              href={getUrl(currentPage + 1)}
              onClick={(e) => handlePageClick(e, currentPage + 1)}
            />
          ) : (
            <div className="pointer-events-none opacity-50">
              <PaginationNext href="#" />
            </div>
          )}
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
}
