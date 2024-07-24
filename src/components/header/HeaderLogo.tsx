"use client";

import Link from "next/link";

export default function HeaderLogo() {
  return (
    <Link
      href="/"
      className="text-xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity"
    >
      Casa Dos Escritores
    </Link>
  );
}
