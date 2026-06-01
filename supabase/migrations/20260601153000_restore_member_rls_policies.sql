-- Restore the minimum permissions used by the member-facing application.
-- Admin policies are managed separately in the admin repository.
grant select, insert, update, delete on table
  public.members,
  public.cards,
  public.card_owners,
  public.settings,
  public.boss_challenges,
  public.boss_purchases,
  public.point_logs,
  public.points_logs,
  public.daily_logins,
  public.shipping_orders,
  public.shop_products,
  public.shop_orders,
  public.grading_submissions
to authenticated;

drop policy if exists "Members can read own profile" on public.members;
drop policy if exists "Members can create own profile" on public.members;
drop policy if exists "Members can update own profile" on public.members;
drop policy if exists "Members can read cards" on public.cards;
drop policy if exists "Members can read card owners" on public.card_owners;
drop policy if exists "Members can read settings" on public.settings;
drop policy if exists "Members can read boss challenges" on public.boss_challenges;
drop policy if exists "Members can read boss purchases" on public.boss_purchases;
drop policy if exists "Members can read own point logs" on public.point_logs;
drop policy if exists "Members can create own point logs" on public.point_logs;
drop policy if exists "Members can read own shop point logs" on public.points_logs;
drop policy if exists "Members can create own shop point logs" on public.points_logs;
drop policy if exists "Members can read own daily logins" on public.daily_logins;
drop policy if exists "Members can create own daily logins" on public.daily_logins;
drop policy if exists "Members can read own shipping orders" on public.shipping_orders;
drop policy if exists "Members can create own shipping orders" on public.shipping_orders;
drop policy if exists "Members can update own shipping orders" on public.shipping_orders;
drop policy if exists "Members can read own shop orders" on public.shop_orders;
drop policy if exists "Members can create own shop orders" on public.shop_orders;
drop policy if exists "Members can read own grading submissions" on public.grading_submissions;
drop policy if exists "Members can create own grading submissions" on public.grading_submissions;
drop policy if exists "Members can update own grading submissions" on public.grading_submissions;
drop policy if exists "Members can delete own grading submissions" on public.grading_submissions;

create policy "Members can read own profile"
on public.members for select to authenticated
using (id = auth.uid());

create policy "Members can create own profile"
on public.members for insert to authenticated
with check (id = auth.uid());

create policy "Members can update own profile"
on public.members for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "Members can read cards"
on public.cards for select to authenticated
using (true);

create policy "Members can read card owners"
on public.card_owners for select to authenticated
using (true);

create policy "Members can read settings"
on public.settings for select to authenticated
using (true);

create policy "Members can read boss challenges"
on public.boss_challenges for select to authenticated
using (true);

create policy "Members can read boss purchases"
on public.boss_purchases for select to authenticated
using (true);

create policy "Members can read own point logs"
on public.point_logs for select to authenticated
using (member_id = auth.uid());

create policy "Members can create own point logs"
on public.point_logs for insert to authenticated
with check (member_id = auth.uid());

create policy "Members can read own shop point logs"
on public.points_logs for select to authenticated
using (member_id = auth.uid());

create policy "Members can create own shop point logs"
on public.points_logs for insert to authenticated
with check (member_id = auth.uid());

create policy "Members can read own daily logins"
on public.daily_logins for select to authenticated
using (member_id = auth.uid());

create policy "Members can create own daily logins"
on public.daily_logins for insert to authenticated
with check (member_id = auth.uid());

create policy "Members can read own shipping orders"
on public.shipping_orders for select to authenticated
using (member_id = auth.uid());

create policy "Members can create own shipping orders"
on public.shipping_orders for insert to authenticated
with check (member_id = auth.uid());

create policy "Members can update own shipping orders"
on public.shipping_orders for update to authenticated
using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy "Members can read own shop orders"
on public.shop_orders for select to authenticated
using (member_id = auth.uid());

create policy "Members can create own shop orders"
on public.shop_orders for insert to authenticated
with check (member_id = auth.uid());

create policy "Members can read own grading submissions"
on public.grading_submissions for select to authenticated
using (member_id = auth.uid());

create policy "Members can create own grading submissions"
on public.grading_submissions for insert to authenticated
with check (member_id = auth.uid());

create policy "Members can update own grading submissions"
on public.grading_submissions for update to authenticated
using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy "Members can delete own grading submissions"
on public.grading_submissions for delete to authenticated
using (member_id = auth.uid());
