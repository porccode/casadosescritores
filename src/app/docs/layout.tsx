import React from "react";
import { DocSidebar } from "@/components/docs/DocSidebar";
import DesktopHeader from "@/components/navigation/DesktopHeader";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DocsFeedbackButton } from "@/components/docs/DocsFeedbackButton";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
            <DesktopHeader
                pageTitle="Central de Ajuda & Documentação"
            />

            <div className="content-wrapper flex flex-col md:flex-row gap-8 py-8 md:py-12">
                {/* Mobile Toggle */}
                <div className="md:hidden mb-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="w-full justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Menu className="h-4 w-4" />
                                    Menu da Documentação
                                </div>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] p-0">
                            <div className="px-6 py-8">
                                <h3 className="text-lg font-bold mb-6">Documentação</h3>
                                <DocSidebar />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-72 shrink-0 sticky top-24 self-start h-[calc(100vh-160px)]">
                    <DocSidebar />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="max-w-[800px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}

                        <Separator className="my-12" />

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border rounded-2xl bg-muted/30 p-8 border-dashed">
                            <div className="space-y-1 text-center sm:text-left">
                                <p className="text-sm font-semibold">Ainda precisa de ajuda?</p>
                                <p className="text-xs text-muted-foreground text-pretty">
                                    Se você não encontrou o que procurava, sinta-se à vontade para nos enviar uma sugestão.
                                </p>
                            </div>
                            <DocsFeedbackButton />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
