/**
 * ITR-3 for assessment year 2026-27 — the form schema and the departmental
 * paths it writes to.
 *
 * `schedules.ts` is what the wizard renders; `paths.ts` is what the JSON builder
 * reads. They are keyed alike, so a field added to one without the other shows
 * up immediately in schedules.test.ts.
 */

export { ITR3_SCHEDULES, ITR3_OPTIONS, itr3Schedule } from '@/lib/itr/itr3/schedules';

export type { TableGroup, TableMap, TableRoute, SpecialRateCode } from '@/lib/itr/itr3/paths';

export {
  SCH_ORDER,
  SCH_ARRAYS,
  SCH_FIELDS,
  SCH_TABLES,
  SCH_ROUTES,
  SCH_SCALAR_IN_ARRAY,
  SCH_ENUM,
  SCH_SI,
  SCH_DATE,
  SCH_NUM,
  SCH_UPPER,
  SCH_STATE,
  SCH_COUNTRY,
  SCH_STATE_FIELDS,
  SCH_COUNTRY_FIELDS,
} from '@/lib/itr/itr3/paths';
