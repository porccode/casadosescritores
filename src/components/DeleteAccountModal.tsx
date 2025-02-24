"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/auth";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userNickname: string;
}

export default function DeleteAccountModal({ isOpen, onClose, userNickname }: DeleteAccountModalProps) {
  const [nicknameInput, setNicknameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(userNickname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nicknameInput !== userNickname) {
      setError("O nickname informado não confere.");
      return;
    }

    if (!passwordInput) {
      setError("Por favor, digite sua senha para confirmar.");
      return;
    }

    setLoading(true);
    try {
      await deleteAccount(passwordInput);
    } catch (err: any) {
      setError(err.message || "Erro ao excluir conta.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Conta Permanentemente
          </DialogTitle>
          <DialogDescription className="pt-2">
            Esta ação é <span className="font-bold text-destructive underline">irreversível</span>.
            Todos os seus dados, incluindo histórias, capítulos, posts e comentários, serão excluídos para sempre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Confirme seu nickname:
            </Label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md border border-dashed border-muted-foreground/30 relative group">
              <code className="flex-1 text-sm font-mono font-bold select-all overflow-hidden text-ellipsis">
                {userNickname}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-background"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-nickname">Digite o nickname acima:</Label>
            <Input
              id="confirm-nickname"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder={userNickname}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Sua senha atual:</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Digite sua senha para confirmar"
            />
          </div>

          {error && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in duration-300">
              {error}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || nicknameInput !== userNickname || !passwordInput}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Conta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
