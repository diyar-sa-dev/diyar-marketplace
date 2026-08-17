import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { Cart, CartValidation, CartItemColor } from '../types/cart.ts';

type CartPayload = { cart: Cart };
type MergePayload = { cart: Cart; warnings: string[] };
type ValidatePayload = { cart: Cart; validation: CartValidation };

export async function fetchCart(): Promise<Cart> {
  const { data } = await apiClient.get<ApiSuccessResponse<CartPayload>>('/cart');
  return data.data.cart;
}

export async function addCartItem(
  productId: string,
  quantity = 1,
  color?: CartItemColor | null,
): Promise<Cart> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<CartPayload>>('/cart/items', {
    product_id: productId,
    quantity,
    ...(color ? { color_name: color.name, color_hex: color.hex_code } : {}),
  });
  return data.data.cart;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<CartPayload>>(`/cart/items/${itemId}`, {
    quantity,
  });
  return data.data.cart;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  await ensureCsrfCookie();
  const { data } = await apiClient.delete<ApiSuccessResponse<CartPayload>>(`/cart/items/${itemId}`);
  return data.data.cart;
}

export async function clearCart(): Promise<Cart> {
  await ensureCsrfCookie();
  const { data } = await apiClient.delete<ApiSuccessResponse<CartPayload>>('/cart');
  return data.data.cart;
}

export async function mergeCart(): Promise<MergePayload> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<MergePayload>>('/cart/merge');
  return data.data;
}

export async function validateCart(): Promise<ValidatePayload> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<ValidatePayload>>('/cart/validate');
  return data.data;
}
