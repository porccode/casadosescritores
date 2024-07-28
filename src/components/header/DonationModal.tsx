"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DonationModal({ open, onClose }: DonationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar border-border bg-card text-card-foreground">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#E53E3E]">
            <Heart className="h-5 w-5 fill-current animate-pulse text-[#E53E3E]" />
            Apoie a Casa dos Escritores
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajude-nos a expandir a nossa infraestrutura literária
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 text-sm leading-relaxed text-foreground/90">
          <p>
            <strong>Olá, escritores.</strong>
          </p>
          <p>
            Como vocês sabem, a nossa plataforma é e sempre será 100% gratuita. Temos o compromisso 
            inabalável de não cobrar assinaturas obrigatórias e de nunca veicular anúncios publicitários 
            que poluam a experiência limpa e focada na leitura e escrita que construímos aqui. A Casa 
            dos Escritores foi idealizada para ser um refúgio literário perfeito, guiado pela empatia: 
            o que não desejamos para nós, jamais imporemos a vocês.
          </p>
          <p>
            Com o crescimento contínuo da comunidade e a chegada de novas sugestões de recursos, queremos 
            expandir as fronteiras da nossa experiência literária. Para disponibilizar novas funcionalidades 
            altamente solicitadas — como o upload ilimitado de imagens de alta definição para personalização 
            de capas e perfis, suporte integrado a vídeos, GIFs, mensagens personalizadas e outras 
            ferramentas dinâmicas de mídia — precisamos expandir significativamente a capacidade e a 
            infraestrutura dos nossos servidores, o que acarreta custos elevados de hospedagem e largura 
            de banda.
          </p>
          <p>
            Se você puder e desejar apoiar este projeto, qualquer contribuição espontânea de qualquer valor 
            será de valor inestimável. Este esforço não é apenas pela nossa equipe técnica, mas por toda a 
            nossa comunidade. Sem o apoio de vocês, este espaço possivelmente não existiria mais.
          </p>
          <p className="font-semibold text-xs text-muted-foreground mt-4 text-center">
            Agradecemos imensamente por fazerem parte desta jornada literária conosco!
          </p>

          <div className="flex flex-col items-center justify-center p-6 bg-muted/40 rounded-xl border border-border/50 space-y-3 mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Clique no botão abaixo para abrir a página oficial do Live Pix e realizar a sua contribuição espontânea:
            </p>
            <Button asChild variant="destructive" className="w-full font-bold px-8 py-5 text-sm shadow-md hover:scale-[1.02] transition-transform">
              <a href="https://livepix.gg/jbrunops" target="_blank" rel="noopener noreferrer">
                Apoiar via Pix (Abrir no Navegador)
              </a>
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            onClick={onClose}
            className="w-full font-bold"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
