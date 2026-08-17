import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { AppShell, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { deleteProduct, listProducts, saveProduct, type Product } from "@/lib/api";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos | Farmácia CRM" },
      {
        name: "description",
        content: "Cadastro de produtos com preço, categoria comercial, estoque e estoque mínimo.",
      },
      { property: "og:title", content: "Produtos | Farmácia CRM" },
      {
        property: "og:description",
        content: "Gerencie o catálogo comercial e o estoque dos produtos da farmácia.",
      },
    ],
  }),
  component: ProductsPage,
});

const empty: Partial<Product> = {
  name: "",
  price: 0,
  stock: 0,
  min_stock: 0,
  active: true,
};

function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Product>>(empty);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => listProducts(search),
  });

  const save = useMutation({
    mutationFn: () => saveProduct({ ...form, name: form.name ?? "" }),
    onSuccess: () => {
      toast.success(form.id ? "Produto atualizado" : "Produto cadastrado");
      setOpen(false);
      setForm(empty);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error("Erro ao salvar", { description: error.message }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Produto excluído");
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      title="Produtos"
      description="Catálogo comercial e controle de estoque"
      actions={
        <Button onClick={openNew}>
          <Plus className="size-4" /> Novo produto
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome, código ou categoria"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : !products || products.length === 0 ? (
          <EmptyState
            title="Nenhum produto cadastrado"
            description="Cadastre seus produtos para registrar vendas e controlar o estoque automaticamente."
            action={
              <Button onClick={openNew}>
                <Package className="size-4" /> Cadastrar produto
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
                      <TableHead>Produto</TableHead>
                      <TableHead className="hidden md:table-cell">Código</TableHead>
                      <TableHead className="hidden md:table-cell">Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {product.code || "—"}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {product.category || "—"}
                        </TableCell>
                        <TableCell>{brl(Number(product.price))}</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.stock <= product.min_stock ? "destructive" : "secondary"}
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={product.active ? "default" : "outline"}>
                            {product.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Editar"
                              onClick={() => {
                                setForm(product);
                                setOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Excluir"
                              onClick={() => setToDelete(product)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              {form.id ? "Editar produto" : "Novo produto"}
            </DialogTitle>
            <DialogDescription>Informações comerciais do produto.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="pname">Nome *</Label>
              <Input
                id="pname"
                required
                value={form.name ?? ""}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={form.code ?? ""}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria comercial</Label>
                <Input
                  id="category"
                  value={form.category ?? ""}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="Higiene, dermocosméticos, genéricos..."
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(form.price ?? 0)}
                  onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={String(form.stock ?? 0)}
                  onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Estoque mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={String(form.min_stock ?? 0)}
                  onChange={(event) => setForm({ ...form, min_stock: Number(event.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Imagem (URL opcional)</Label>
              <Input
                id="image"
                value={form.image_url ?? ""}
                onChange={(event) => setForm({ ...form, image_url: event.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Produto ativo</p>
                <p className="text-xs text-muted-foreground">Disponível para venda.</p>
              </div>
              <Switch
                checked={form.active !== false}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
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
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} será removido do catálogo.
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
