import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { pincodes } from './db/schema';
import { ODISHA_PINCODES } from './odisha-pincodes';
import { odishaPincodeRow, previewUpdate } from './catalog-update';

const ODISHA = new Map(ODISHA_PINCODES);

/**
 * One pincode's delivery, installation and water-testing row. On a local preview of the pending catalogue update
 * (PREVIEW_CATALOG_UPDATE=1, dev only) the client's Odisha list stands in for the table, as it will after
 * `npm run catalog:update -- --apply`; everywhere else this is a plain database read.
 */
export async function findPincode(pin: string) {
  const row = await db.query.pincodes.findFirst({ where: eq(pincodes.pincode, pin) });
  if (!previewUpdate()) return row ?? null;
  const district = ODISHA.get(pin);
  return district ? odishaPincodeRow(pin, district) : row && row.state !== 'Odisha' ? { ...row, serviceable: false, installation: false, waterTesting: false } : row ?? null;
}
