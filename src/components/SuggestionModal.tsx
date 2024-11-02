"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, CheckCircle, ImagePlus, X, Paperclip, LogIn } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SuggestionModal() {
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verificar auth ao abrir
  useEffect(() => {
    if (open && isAuthenticated === null) {
      supabase.auth.getUser().then(({ data }) => {
        setIsAuthenticated(!!data.user);
        if (data.user?.email && !email) {
            setEmail(data.user.email);
        }
      });
    }
  }, [open, isAuthenticated, supabase, email]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSuccess(false);
        setError("");
      }, 300);
    }
  }, [open]);

  // Auto-close after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setOpen(false);
        // Clear form after closing
        setTimeout(() => {
          setEmail("");
          setMessage("");
          setImageFile(null);
          setImageUrl(null);
          setSuccess(false);
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione uma imagem");
        return;
      }
      setImageFile(file);
      setError("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      // ✅ Otimização: Comprimir a imagem antes do upload
      const { compressImage } = await import("@/lib/utils");
      const compressedFile = await compressImage(file, 1200, 0.7);

      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.webp`;
      const filePath = `suggestions/${fileName}`;

      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, compressedFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error("Upload error:", err);
      throw new Error("Erro ao fazer upload da imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !message.trim()) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let finalImageUrl = null;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          message: message.trim(),
          image_url: finalImageUrl
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao enviar sugestão");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar sugestão");
    } finally {
      setLoading(false);
    }
  }

  if (!isMounted) {
    return (
      <Button
        variant="default"
        className="w-full sm:w-auto font-medium"
      >
        Enviar Sugestão
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full sm:w-auto font-medium"
        >
          Enviar Sugestão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl font-bold mb-2">Sugestão Enviada!</DialogTitle>
            <DialogDescription className="text-center max-w-[280px]">
              Obrigado por contribuir. Sua mensagem foi recebida com sucesso.
            </DialogDescription>
            <p className="text-xs text-muted-foreground mt-6">Fechando em 5 segundos...</p>
          </div>
        ) : isAuthenticated === null ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Verificando Autenticação</DialogTitle>
              <DialogDescription>
                Aguarde enquanto verificamos o estado de autenticação.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-4">Verificando...</p>
            </div>
          </>
        ) : isAuthenticated === false ? (
            <>
                <DialogHeader>
                <DialogTitle>Enviar Sugestão</DialogTitle>
                <DialogDescription>
                    Compartilhe suas ideias para melhorar a Casa dos Escritores.
                </DialogDescription>
                </DialogHeader>
                <div className="py-6 text-center space-y-5">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed px-4">
                        Para podermos responder às suas sugestões e notificá-lo sobre o andamento, <strong>é necessário estar logado</strong>.
                    </p>
                    <Button 
                        onClick={() => router.push("/login?ref=suggestion")} 
                        className="w-full mt-2"
                    >
                        Fazer Login para Enviar
                    </Button>
                </div>
            </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enviar Sugestão</DialogTitle>
              <DialogDescription>
                Compartilhe suas ideias para melhorar a Casa dos Escritores.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Descreva sua sugestão..."
                  className="min-h-[120px] resize-none"
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              {imageFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md border text-xs">
                  <Paperclip size={14} className="flex-shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1 font-medium">{imageFile.name} ({(imageFile.size / 1024).toFixed(0)}KB)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeImage}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadingImage || !!imageFile}
                  className="flex items-center gap-2 text-xs"
                >
                  <ImagePlus size={16} />
                  Anexar Imagem
                </Button>

                <Button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="flex-1"
                >
                  {loading || uploadingImage ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {uploadingImage ? "Subindo..." : "Enviando..."}
                    </>
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

