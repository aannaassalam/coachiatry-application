/**
 * Predefined colour palette used when creating a Category or Status.
 * Kept in sync with the web app (coachiatry) so the same swatches are
 * available across platforms. Each swatch defines a soft background (`bg`)
 * paired with an accessible foreground (`text`).
 */
export type TaxonomyColor = {
  bg: string;
  text: string;
};

export const predefinedColors: TaxonomyColor[] = [
  { bg: '#FEE2E2', text: '#B91C1C' }, // Crimson Red
  { bg: '#FEF3C7', text: '#92400E' }, // Amber Gold
  { bg: '#DCFCE7', text: '#166534' }, // Emerald Green
  { bg: '#DBEAFE', text: '#1E3A8A' }, // Azure Blue
  { bg: '#E0E7FF', text: '#3730A3' }, // Indigo
  { bg: '#F5E1FE', text: '#86198F' }, // Orchid Purple
  { bg: '#E0F2FE', text: '#075985' }, // Sky Teal
  { bg: '#FFF1F2', text: '#9D174D' }, // Rose Pink
  { bg: '#F0FDF4', text: '#166534' }, // Mint Green
  { bg: '#FEF9C3', text: '#854D0E' }, // Mustard Yellow
];
