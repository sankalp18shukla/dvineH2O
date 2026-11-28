-- Homepage blog strip (website update brief, Nov 2026): up to three featured posts, in an order chosen in Admin › Blog.
-- feature_order 1–3 is the post's tile on the homepage; 0 means not featured. Additive: older code ignores the column.
alter table dvine.posts add column if not exists feature_order smallint not null default 0;
update dvine.posts set feature_order = 1 where featured and feature_order = 0;
