-- The storefront only needs to read products that are currently for sale.
-- Admin operations must stay behind a trusted server-side API.
alter table public.shop_products enable row level security;

grant select on table public.shop_products to authenticated;

create policy "Storefront can read active shop products"
on public.shop_products
for select
to authenticated
using (is_active = true);
