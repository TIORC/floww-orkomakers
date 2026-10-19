import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Home, BookOpen, Calendar, Play, CheckCircle2, Route as RouteIcon,
  Bell, HelpCircle, Settings, Rocket,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Orcoma Orkomakers" },
      { name: "description", content: "Painel da plataforma Orcoma Orkomakers." },
      { property: "og:title", content: "Painel — Orcoma Orkomakers" },
      { property: "og:description", content: "Painel da plataforma Orcoma Orkomakers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const groups = [
  { label: null, items: [{ title: "Início", icon: Home }] },
  { label: "Aprendizado", items: [{ title: "Catálogo", icon: BookOpen }, { title: "Eventos", icon: Calendar }] },
  { label: "Progresso", items: [
    { title: "Continuar assistindo", icon: Play },
    { title: "Cursos concluídos", icon: CheckCircle2 },
    { title: "Trilhas de aprendizagem", icon: RouteIcon },
  ] },
  { label: "Geral", items: [
    { title: "Notificações", icon: Bell },
    { title: "Suporte", icon: HelpCircle },
    { title: "Configurações", icon: Settings },
  ] },
];

function Index() {
  const [active, setActive] = useState("Início");
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-panel-active bg-panel">
        <div className="flex h-44 flex-col items-center justify-center border-b border-panel-active">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">Orcoma</span>
          <span className="flex items-center gap-1 text-2xl font-extrabold text-brand">
            <Rocket className="h-6 w-6" /> Orkomakers
          </span>
          <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-panel-label">Painel</span>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {groups.map((g, i) => (
            <div key={i} className="pb-2">
              {g.label && (
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-panel-label">{g.label}</p>
              )}
              {g.items.map(({ title, icon: Icon }) => {
                const on = active === title;
                return (
                  <button
                    key={title}
                    onClick={() => setActive(title)}
                    className={`flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                      on ? "bg-panel-active font-semibold text-brand" : "text-panel-text hover:bg-panel-active/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {title}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-foreground">{active}</h1>
        <p className="mt-2 text-panel-text">Bem-vindo ao painel Orcoma Orkomakers.</p>
      </main>
    </div>
  );
}
