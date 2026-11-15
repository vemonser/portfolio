/**
 * The Home work sequence's shape: how many projects it shows and which
 * twelve-column cells each one occupies. Kept as plain data so the section and
 * the layout guard agree on one source of truth.
 */
export const HOME_COUNT = 6;

/**
 * A wide feature beside a smaller companion, a balanced pair inset from the
 * reading edge, then a closing pair for the sixth slot. The classes pair with
 * `lg:grid-cols-12` in ProjectIndex.
 */
export const HOME_LAYOUT = [
  "lg:col-span-7",
  "lg:col-start-9 lg:col-span-4",
  "lg:col-start-2 lg:col-span-5",
  "lg:col-start-8 lg:col-span-5",
  "lg:col-span-6",
  "lg:col-start-8 lg:col-span-5",
];
