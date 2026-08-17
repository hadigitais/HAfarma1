import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  Cross,
  MessageCircle,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farmácia CRM — Gestão comercial para farmácias" },
      {
        name: "description",
        content:
          "CRM comercial para farmácias: cadastro de clientes, produtos, registro de vendas, controle de estoque e indicadores em um painel único.",
      },
      { property: "og:title", content: "Farmácia CRM — Gestão comercial para farmácias" },
      {
        property: "og:description",
        content:
          "Clientes, produtos, vendas, estoque e indicadores comerciais para o varejo farmacêutico, com dados isolados por empresa.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Users, title: "Clientes", text: "Base comercial com contato direto por WhatsApp e consentimento registrado." },
  { icon: Boxes, title: "Produtos e estoque", text: "Catálogo com preço, categoria e alerta de estoque mínimo." },
  { icon: ShoppingCart, title: "Vendas", text: "Registro de vendas com subtotal, total e baixa automática de estoque." },
  { icon: BarChart3, title: "Indicadores", text: "Vendas do dia e do mês, ticket médio e evolução diária." },
  { icon: MessageCircle, title: "Relacionamento", text: "Identifique clientes sem comprar e reative pelo WhatsApp." },
  { icon: ShieldCheck, title: "Multiempresa", text: "Cada empresa com seus usuários e dados totalmente isolados." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand">
            <Cross className="size-4 text-primary-foreground" strokeWidth={3} />
          </span>
          <span className="font-display text-base font-semibold">Farmácia CRM</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-16">
        <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Gestão comercial para o varejo farmacêutico
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight md:text-5xl">
          Venda mais e mantenha seus clientes ativos com um CRM feito para farmácias
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground">
          Cadastre clientes e produtos, registre vendas, controle estoque e acompanhe indicadores
          comerciais em um painel moderno — no computador, tablet ou celular.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Criar conta da empresa</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="shadow-card">
              <CardContent className="pt-6">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 font-display text-base font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          Farmácia CRM é uma ferramenta exclusivamente comercial e de gestão de vendas. Não armazena
          dados clínicos, prescrições ou informações de saúde.
        </p>
      </footer>
    </div>
  );
}
