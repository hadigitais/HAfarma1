import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { AppShell, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteCustomer, listCustomers, saveCustomer, type Customer } from "@/lib/api";
import { shortDate, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | Farmácia CRM" },
      {
        name: "description",
        content: "Cadastre, pesquise e gerencie os clientes comerciais da sua farmácia com contato por WhatsApp.",
      },
      { property: "og:title", content: "Clientes | Farmácia CRM" },
      {
        property: "og:description",
        content: "Base de clientes comerciais da farmácia com pesquisa, edição e contato por WhatsApp.",
      },
    ],
  }),
  component: CustomersPage,
});

const empty: Partial<Customer> = { name: "", marketing_consent: false };

function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>(empty);
  const [toDelete, setToDelete] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => listCustomers(search),
  });

  const save = useMutation({
    mutationFn: () => saveCustomer({ ...form, name: form.name ?? "" }),
    onSuccess: () => {
      toast.success(form.id ? "Cliente atualizado" : "Cliente cadastrado");
      setOpen(false);
      setForm(empty);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error("Erro ao salvar", { description: error.message }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      toast.success("Cliente excluído");
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error("Erro ao excluir", { description: error.message }),
  });

  function openNew() {
    setForm(empty);
    setOpen(true);
  }

  return (
    <AppShell
      title="Clientes"
      description="Cadastro comercial de clientes"
      actions={
        <Button onClick={openNew}>
          <Plus className="size-4" /> Novo cliente
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome, WhatsApp, e-mail ou cidade"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : !customers || customers.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Cadastre seus clientes para acompanhar o histórico comercial e criar ações de relacionamento."
            action={
              <Button onClick={openNew}>
                <Plus className="size-4" /> Cadastrar cliente
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead className="hidden md:table-cell">Localidade</TableHead>
                      <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                      <TableHead className="hidden lg:table-cell">Consentimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const link = whatsappLink(customer.whatsapp, `Olá ${customer.name}!`);
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>{customer.whatsapp || customer.phone || "—"}</div>
                            <div className="text-xs">{customer.email}</div>
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                            {[customer.neighborhood, customer.city].filter(Boolean).join(" · ") || "—"}
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                            {shortDate(customer.created_at)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={customer.marketing_consent ? "default" : "secondary"}>
                              {customer.marketing_consent ? "Autorizado" : "Não autorizado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {link ? (
                                <Button asChild size="icon" variant="ghost" title="WhatsApp">
                                  <a href={link} target="_blank" rel="noreferrer">
                                    <MessageCircle className="size-4" />
                                  </a>
                                </Button>
                              ) : null}
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Editar"
                                onClick={() => {
                                  setForm(customer);
                                  setOpen(true);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Excluir"
                                onClick={() => setToDelete(customer)}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {form.id ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>
              Registre apenas informações comerciais necessárias à operação.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                required
                value={form.name ?? ""}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp ?? ""}
                  onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone ?? ""}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={form.city ?? ""}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={form.neighborhood ?? ""}
                  onChange={(event) => setForm({ ...form, neighborhood: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações comerciais</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes ?? ""}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Preferências de compra, condições comerciais, canal de contato preferido..."
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Consentimento comercial</p>
                <p className="text-xs text-muted-foreground">
                  Autoriza receber comunicações e ofertas.
                </p>
              </div>
              <Switch
                checked={Boolean(form.marketing_consent)}
                onCheckedChange={(checked) => setForm({ ...form, marketing_consent: checked })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(value) => !value && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} será removido do cadastro. As vendas registradas serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
