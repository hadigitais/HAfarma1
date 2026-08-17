import { supabase } from "@/integrations/supabase/client";

export type Customer = {
  id: string;
  company_id: string;
  name: string;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  neighborhood: string | null;
  notes: string | null;
  marketing_consent: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  category: string | null;
  price: number;
  stock: number;
  min_stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
};

export type Sale = {
  id: string;
  customer_id: string | null;
  payment_method: string;
  total: number;
  sold_at: string;
};

export type SaleItemInput = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
};

async function requireCompanyId() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sessão expirada. Entre novamente.");
  const { data, error } = await supabase
    .from("profiles")
    .select("company_id, full_name, email")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Perfil da empresa não encontrado.");
  return data.company_id as string;
}

export async function fetchProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, company_id, companies(name)")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data as
    | { id: string; full_name: string | null; email: string | null; company_id: string; companies: { name: string } | null }
    | null;
}

/* Clientes */
export async function listCustomers(search = "") {
  let query = supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},whatsapp.ilike.${term},email.ilike.${term},city.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function saveCustomer(input: Partial<Customer> & { name: string }) {
  if (input.id) {
    const { id, company_id: _company, created_at: _created, ...rest } = input;
    const { error } = await supabase.from("customers").update(rest).eq("id", id);
    if (error) throw error;
    return;
  }
  const company_id = await requireCompanyId();
  const { error } = await supabase.from("customers").insert({ ...input, company_id });
  if (error) throw error;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

/* Produtos */
export async function listProducts(search = "") {
  let query = supabase.from("products").select("*").order("name");
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},code.ilike.${term},category.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function saveProduct(input: Partial<Product> & { name: string }) {
  if (input.id) {
    const { id, company_id: _company, created_at: _created, ...rest } = input;
    const { error } = await supabase.from("products").update(rest).eq("id", id);
    if (error) throw error;
    return;
  }
  const company_id = await requireCompanyId();
  const { error } = await supabase.from("products").insert({ ...input, company_id });
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/* Vendas */
export type SaleWithCustomer = Sale & { customers: { name: string } | null };

export async function listSales() {
  const { data, error } = await supabase
    .from("sales")
    .select("id, customer_id, payment_method, total, sold_at, customers(name)")
    .order("sold_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as SaleWithCustomer[];
}

export async function listSaleItems(saleId: string) {
  const { data, error } = await supabase
    .from("sale_items")
    .select("id, product_name, quantity, unit_price, subtotal")
    .eq("sale_id", saleId);
  if (error) throw error;
  return data ?? [];
}

export async function createSale(input: {
  customer_id: string | null;
  payment_method: string;
  items: SaleItemInput[];
}) {
  if (input.items.length === 0) throw new Error("Adicione pelo menos um produto.");
  const company_id = await requireCompanyId();
  const total = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const { data: sale, error } = await supabase
    .from("sales")
    .insert({
      company_id,
      customer_id: input.customer_id,
      payment_method: input.payment_method,
      total,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("sale_items").insert(
    input.items.map((item) => ({
      company_id,
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    })),
  );
  if (itemsError) throw itemsError;
  return sale.id as string;
}

/* Indicadores */
export type DashboardData = {
  todayTotal: number;
  monthTotal: number;
  salesCount: number;
  customersCount: number;
  averageTicket: number;
  inactiveCustomers: { id: string; name: string; whatsapp: string | null; lastPurchase: string | null }[];
  chart: { label: string; total: number }[];
  lowStock: { id: string; name: string; stock: number; min_stock: number }[];
};

export async function fetchDashboard(): Promise<DashboardData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const start30 = new Date(now.getTime() - 29 * 86_400_000).toISOString();

  const [salesRes, customersRes, productsRes] = await Promise.all([
    supabase.from("sales").select("id, total, sold_at, customer_id").gte("sold_at", start30),
    supabase.from("customers").select("id, name, whatsapp, created_at"),
    supabase.from("products").select("id, name, stock, min_stock").eq("active", true),
  ]);
  if (salesRes.error) throw salesRes.error;
  if (customersRes.error) throw customersRes.error;
  if (productsRes.error) throw productsRes.error;

  const sales = salesRes.data ?? [];
  const monthSales = sales.filter((s) => s.sold_at >= startOfMonth);
  const monthTotal = monthSales.reduce((sum, s) => sum + Number(s.total), 0);
  const todayTotal = sales
    .filter((s) => s.sold_at >= startOfDay)
    .reduce((sum, s) => sum + Number(s.total), 0);

  const { data: lastSales, error: lastError } = await supabase
    .from("sales")
    .select("customer_id, sold_at")
    .not("customer_id", "is", null)
    .order("sold_at", { ascending: false })
    .limit(1000);
  if (lastError) throw lastError;

  const lastByCustomer = new Map<string, string>();
  for (const sale of lastSales ?? []) {
    if (sale.customer_id && !lastByCustomer.has(sale.customer_id)) {
      lastByCustomer.set(sale.customer_id, sale.sold_at);
    }
  }
  const limit = new Date(now.getTime() - 60 * 86_400_000).toISOString();
  const inactiveCustomers = (customersRes.data ?? [])
    .map((c) => ({
      id: c.id,
      name: c.name,
      whatsapp: c.whatsapp,
      lastPurchase: lastByCustomer.get(c.id) ?? null,
    }))
    .filter((c) => (c.lastPurchase ? c.lastPurchase < limit : true))
    .sort((a, b) => (a.lastPurchase ?? "").localeCompare(b.lastPurchase ?? ""))
    .slice(0, 8);

  const chart: { label: string; total: number }[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(day.getTime() + 86_400_000);
    const total = sales
      .filter((s) => new Date(s.sold_at) >= day && new Date(s.sold_at) < next)
      .reduce((sum, s) => sum + Number(s.total), 0);
    chart.push({
      label: `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
      total,
    });
  }

  return {
    todayTotal,
    monthTotal,
    salesCount: monthSales.length,
    customersCount: (customersRes.data ?? []).length,
    averageTicket: monthSales.length ? monthTotal / monthSales.length : 0,
    inactiveCustomers,
    chart,
    lowStock: (productsRes.data ?? []).filter((p) => p.stock <= p.min_stock).slice(0, 8),
  };
}
