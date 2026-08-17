import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeDollarSign,
  CalendarDays,
  MessageCircle,
  Package,
  Plus,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";

import { AppShell, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboard } from "@/lib/api";
import { brl, daysSince, shortDate, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard comercial | Farmácia CRM" },
      {
        name: "description",
        content: "Vendas do dia e do mês, ticket médio, clientes e alertas de estoque da sua farmácia.",
      },
      { property: "og:title", content: "Dashboard comercial | Farmácia CRM" },
      {
        property: "og:description",
        content: "Indicadores comerciais da farmácia: vendas, ticket médio, clientes e estoque.",
      },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  hint?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  return (
    <AppShell
      title="Dashboard"
      description="Visão geral comercial do estabelecimento"
      actions={
        <>
          <Button asChild>
            <Link to="/vendas">
              <Plus className="size-4" /> Nova venda
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/clientes">
              <Plus className="size-4" /> Novo cliente
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/produtos">
              <Plus className="size-4" /> Novo produto
            </Link>
          </Button>
        </>
      }
    >
      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Vendas do dia" value={brl(data.todayTotal)} icon={BadgeDollarSign} />
            <StatCard label="Vendas do mês" value={brl(data.monthTotal)} icon={CalendarDays} />
            <StatCard label="Qtd. de vendas (mês)" value={String(data.salesCount)} icon={ReceiptText} />
            <StatCard label="Ticket médio" value={brl(data.averageTicket)} icon={TrendingUp} />
            <StatCard label="Clientes" value={String(data.customersCount)} icon={Users} />
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Vendas dos últimos 14 dias</CardTitle>
              <CardDescription>Total faturado por dia</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickFormatter={(value: number) => brl(value)}
                  />
                  <Tooltip
                    formatter={(value: number) => brl(value)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#salesFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base">Clientes sem comprar</CardTitle>
                <CardDescription>Sem compras nos últimos 60 dias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.inactiveCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cliente inativo no momento.
                  </p>
                ) : (
                  data.inactiveCustomers.map((customer) => {
                    const link = whatsappLink(
                      customer.whatsapp,
                      `Olá ${customer.name}, temos novidades e condições especiais na nossa farmácia!`,
                    );
                    const days = daysSince(customer.lastPurchase);
                    return (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-gradient-surface px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.lastPurchase
                              ? `Última compra: ${shortDate(customer.lastPurchase)} (${days} dias)`
                              : "Nunca comprou"}
                          </p>
                        </div>
                        {link ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={link} target="_blank" rel="noreferrer">
                              <MessageCircle className="size-4" /> WhatsApp
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="secondary">Sem WhatsApp</Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base">Estoque em alerta</CardTitle>
                <CardDescription>Produtos no limite mínimo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lowStock.length === 0 ? (
                  <EmptyState
                    title="Estoque saudável"
                    description="Nenhum produto abaixo do estoque mínimo."
                    action={
                      <Button asChild variant="outline" size="sm">
                        <Link to="/produtos">
                          <Package className="size-4" /> Ver produtos
                        </Link>
                      </Button>
                    }
                  />
                ) : (
                  data.lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-gradient-surface px-4 py-3"
                    >
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <Badge variant="destructive">
                        {product.stock} / mín. {product.min_stock}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
