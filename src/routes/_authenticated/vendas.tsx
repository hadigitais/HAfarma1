import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";

import { AppShell, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createSale,
  listCustomers,
  listProducts,
  listSales,
  type SaleItemInput,
} from "@/lib/api";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas | Farmácia CRM" },
      {
        name: "description",
        content: "Registre vendas com cliente, produtos, quantidade e forma de pagamento, com baixa automática de estoque.",
      },
      { property: "og:title", content: "Vendas | Farmácia CRM" },
      {
        property: "og:description",
        content: "Registro de vendas da farmácia com cálculo automático de subtotal, total e estoque.",
      },
    ],
  }),
  component: SalesPage,
});

const PAYMENTS = ["dinheiro", "pix", "débito", "crédito", "convênio"];

function SalesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("none");
  const [payment, setPayment] = useState("dinheiro");
  const [items, setItems] = useState<SaleItemInput[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  const { data: sales, isLoading } = useQuery({ queryKey: ["sales"], queryFn: listSales });
  const { data: customers } = useQuery({ queryKey: ["customers", ""], queryFn: () => listCustomers("") });
  const { data: products } = useQuery({ queryKey: ["products", ""], queryFn: () => listProducts("") });

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const create = useMutation({
    mutationFn: () =>
      createSale({
        customer_id: customerId === "none" ? null : customerId,
        payment_method: payment,
        items,
      }),
    onSuccess: () => {
      toast.success("Venda registrada", { description: "Estoque e indicadores atualizados." });
      setOpen(false);
      setItems([]);
      setCustomerId("none");
      setPayment("dinheiro");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error("Erro ao registrar venda", { description: error.message }),
  });

  function addItem() {
    const product = products?.find((item) => item.id === productId);
    if (!product) {
      toast.error("Selecione um produto");
      return;
    }
    if (quantity < 1) {
      toast.error("Quantidade inválida");
      return;
    }
    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice || Number(product.price),
      },
    ]);
    setProductId("");
    setQuantity(1);
    setUnitPrice(0);
  }

  return (
    <AppShell
      title="Vendas"
      description="Histórico comercial de vendas"
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nova venda
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : !sales || sales.length === 0 ? (
        <EmptyState
          title="Nenhuma venda registrada"
          description="Registre a primeira venda para acompanhar faturamento, ticket médio e estoque."
          action={
            <Button onClick={() => setOpen(true)}>
              <ShoppingCart className="size-4" /> Registrar venda
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
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {dateTime(sale.sold_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.customers?.name ?? "Consumidor final"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="capitalize">
                          {sale.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {brl(Number(sale.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Nova venda</DialogTitle>
            <DialogDescription>
              Selecione o cliente, adicione produtos e confirme para dar baixa no estoque.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Consumidor final" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Consumidor final</SelectItem>
                    {(customers ?? []).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENTS.map((method) => (
                      <SelectItem key={method} value={method} className="capitalize">
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select
                    value={productId}
                    onValueChange={(value) => {
                      setProductId(value);
                      const product = products?.find((item) => item.id === value);
                      setUnitPrice(product ? Number(product.price) : 0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products ?? [])
                        .filter((product) => product.active)
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} · est. {product.stock}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qtd.</Label>
                  <Input
                    type="number"
                    min="1"
                    value={String(quantity)}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(unitPrice)}
                    onChange={(event) => setUnitPrice(Number(event.target.value))}
                  />
                </div>
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="size-4" /> Adicionar
                </Button>
              </div>

              {items.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.product_id}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="font-medium">{brl(item.quantity * item.unit_price)}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setItems(items.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum item adicionado.</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gradient-brand px-4 py-3">
              <span className="text-sm text-primary-foreground/85">Total da venda</span>
              <span className="font-display text-xl font-semibold text-primary-foreground">
                {brl(total)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || items.length === 0}
            >
              Confirmar venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
