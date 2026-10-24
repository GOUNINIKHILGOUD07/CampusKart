export interface LocalUser {
  id: string;
  email: string;
  display_name: string;
}

export interface LocalProduct {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  condition: string;
  price: number;
  description: string;
  created_at: string;
  updated_at: string;
  is_sold: boolean;
  images: { id: string; url: string; position: number }[];
  category?: { name: string; slug: string };
  seller?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    college: string | null;
    created_at: string;
  };
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ck:local_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user: LocalUser | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem("ck:local_user");
  } else {
    localStorage.setItem("ck:local_user", JSON.stringify(user));
  }
}

export function getLocalProducts(): LocalProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ck:local_products");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalProduct(product: LocalProduct): void {
  if (typeof window === "undefined") return;
  const list = getLocalProducts().filter((p) => p.id !== product.id);
  list.unshift(product);
  localStorage.setItem("ck:local_products", JSON.stringify(list));
}

export async function saveSharedProduct(product: LocalProduct): Promise<void> {
  saveLocalProduct(product);
  try {
    await fetch("/api/local-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
  } catch (err) {
    console.warn("Could not save to /api/local-products:", err);
  }
}

export async function getSharedProducts(): Promise<LocalProduct[]> {
  try {
    const local = getLocalProducts();
    const res = await fetch("/api/local-products");
    if (res.ok) {
      let serverProducts = (await res.json()) as LocalProduct[];
      if (!Array.isArray(serverProducts)) serverProducts = [];

      // Auto-upload any product that exists in this browser's localStorage to the shared server store!
      const missingOnServer = local.filter((lp) => !serverProducts.some((sp) => sp.id === lp.id));
      if (missingOnServer.length > 0) {
        for (const item of missingOnServer) {
          await fetch("/api/local-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          }).catch(() => {});
        }
        serverProducts = [...missingOnServer, ...serverProducts];
      }

      localStorage.setItem("ck:local_products", JSON.stringify(serverProducts));
      return serverProducts;
    }
  } catch {
    // fallback to local
  }
  return getLocalProducts();
}

export async function getSharedProductById(id: string): Promise<LocalProduct | null> {
  const local = getLocalProducts().find((p) => p.id === id);
  if (local) return local;
  const shared = await getSharedProducts();
  return shared.find((p) => p.id === id) ?? null;
}

export function getLocalProductById(id: string): LocalProduct | null {
  return getLocalProducts().find((p) => p.id === id) ?? null;
}
