-- Serviceable pincodes can be managed from a linked Google Sheet (Admin › Settings › Google Sheets).
-- When a row is removed from the sheet, the website removes that pincode, so the app role needs delete here.
-- Nothing references dvine.pincodes by foreign key: orders keep their own copy of the address.
grant delete on dvine.pincodes to dvine_app;
drop policy if exists app_delete on dvine.pincodes;
create policy app_delete on dvine.pincodes for delete to dvine_app using (true);
