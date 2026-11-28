/**
 * Crystal's performance report, from DVINE's "Performance Evaluation & Value Addition" report (client, Nov 2026):
 * Part A, the general value-addition report (LAB-WQR-2026-012), and Part B, the case studies (DD-CS-2026-01…05).
 * In-house tests by DVINE R&D on Crystal DC-5114, serial DC-2026-V1-0089.
 *
 * Only filled-in results are used. Left out on purpose: case study 1 (its raw water was pH 7.20, so the report itself
 * says it does not show correction of acidic water), the turbidity end-of-life row (marked "confirm" in the report),
 * and any field the report marks as a placeholder.
 */

export type Row = { label: string; unit?: string; before: string; after: string; change: string; down?: boolean; limit?: string };

export const REPORT = {
  ref: 'LAB-WQR-2026-012',
  model: 'Crystal DC-5114',
  lab: 'DVINE R&D Department, Bhubaneswar',
  tested: '9–10 October 2026',
  reported: '11 October 2026',
  standard: 'IS 10500, India’s drinking water specification',
  /** Table 19, "Key findings at a glance" */
  findings: [
    { label: 'Turbidity', unit: 'NTU', before: '2.80', after: '0.20', change: '92.9%', down: true, limit: 'Max 1 / 5' },
    { label: 'TDS', unit: 'mg/L', before: '310', after: '185', change: '40.3%', down: true, limit: 'Max 500 / 2,000' },
    { label: 'Total hardness', unit: 'mg/L', before: '180', after: '115', change: '36.1%', down: true, limit: 'Max 200 / 600' },
    { label: 'Free chlorine', unit: 'mg/L', before: '2.05', after: '<0.02', change: '>99.0%', down: true },
    { label: 'Total iron', unit: 'mg/L', before: '1.80', after: '0.04', change: '97.8%', down: true, limit: 'Max 1.0' },
    { label: 'pH (alkaline mode)', before: '7.20', after: '8.65', change: '20.1%', limit: '6.5 – 8.5' },
    { label: 'Total alkalinity', unit: 'mg/L', before: '140', after: '155', change: '10.7%', limit: 'Max 200 / 600' },
    { label: 'E. coli', unit: 'CFU/100 mL', before: '18', after: 'Absent', change: '100%', down: true, limit: 'Not detectable' },
  ] as Row[],
  /** Table 10 */
  modes: [
    { mode: 'Ambient', target: 'Up to pH 7.5', measured: '7.40', note: 'Filtered, alkaline stage off' },
    { mode: 'Alk+', target: 'Up to pH 8.5', measured: '8.65', note: 'Everyday drinking preset' },
    { mode: 'Alk++', target: 'Up to pH 9.5', measured: '9.35', note: 'For occasional use' },
  ],
  /** Table 9: final outlet as a share of the raw inlet */
  minerals: [
    { label: 'Potassium', kept: 89.6 }, { label: 'Sodium', kept: 88.6 }, { label: 'Calcium', kept: 68.8 },
    { label: 'Magnesium', kept: 66.7 }, { label: 'Total alkalinity', kept: 95.5 },
  ],
  /** Table 12: Alk++ water in a sealed glass bottle at about 24–25 °C */
  stability: [
    { at: 'Fresh', ph: '9.35', orp: '−480', h2: '0.85' },
    { at: '1 hour', ph: '9.28', orp: '−395', h2: '0.65' },
    { at: '6 hours', ph: '9.15', orp: '−260', h2: '0.38' },
    { at: '24 hours', ph: '8.95', orp: '−110', h2: '0.12' },
    { at: '48 hours', ph: '8.75', orp: '+45', h2: 'Below 0.05' },
  ],
  /** Table 16: municipal water spiked to 350 mg/L TDS, 2.0 NTU and 1.5 mg/L chlorine */
  endurance: [
    { litres: '0', flow: '1.85', chlorine: '<0.02' },
    { litres: '1,500', flow: '1.80', chlorine: '<0.02' },
    { litres: '3,000', flow: '1.74', chlorine: '0.03' },
    { litres: '4,500', flow: '1.62', chlorine: '0.04' },
    { litres: '6,000', flow: '1.50', chlorine: '0.06' },
  ],
  system: [
    { label: 'Energy use', value: 'About 0.35 Wh per litre' },
    { label: 'Plates after 62.5 hours of electrolysis', value: 'Intact, no flaking or scale' },
    { label: 'Leak check', value: 'Passed at 100 psi' },
  ],
  /** Part B, case studies 2–5 (Table 11 and each study) */
  cases: [
    {
      key: 'iron', n: '02', title: 'Iron-rich water', where: 'Groundwater, Phulnakhara, Cuttack',
      problem: 'Dissolved iron turns water reddish-brown once it meets air, tastes metallic and stains utensils, clothes and fittings.',
      rows: [
        { label: 'Total iron', unit: 'mg/L', before: '2.40', after: '0.05', change: '97.9%', down: true, limit: 'Max 1.0' },
        { label: 'Turbidity', unit: 'NTU', before: '4.80', after: '0.22', change: '95.4%', down: true, limit: 'Max 1 / 5' },
        { label: 'TDS', unit: 'mg/L', before: '340', after: '195', change: '42.6%', down: true, limit: 'Max 500 / 2,000' },
        { label: 'Total hardness', unit: 'mg/L', before: '185', after: '125', change: '32.4%', down: true, limit: 'Max 200 / 600' },
      ] as Row[],
      read: 'Total iron went from above the IS 10500 limit to within it.',
    },
    {
      key: 'hard', n: '03', title: 'Hardness-rich water', where: 'Groundwater, Konark, Puri',
      problem: 'Calcium and magnesium leave white scale on kettles, geysers and taps, and make soap hard to lather.',
      rows: [
        { label: 'Total hardness', unit: 'mg/L', before: '450', after: '210', change: '53.3%', down: true, limit: 'Max 200 / 600' },
        { label: 'Calcium', unit: 'mg/L', before: '120', after: '58', change: '51.7%', down: true, limit: 'Max 75 / 200' },
        { label: 'Magnesium', unit: 'mg/L', before: '36', after: '15.5', change: '56.9%', down: true, limit: 'Max 30 / 100' },
        { label: 'TDS', unit: 'mg/L', before: '580', after: '310', change: '46.6%', down: true, limit: 'Max 500 / 2,000' },
      ] as Row[],
      read: 'Hardness fell by more than half, to 210 mg/L: within the permissible limit, and still just above the acceptable limit of 200.',
    },
    {
      key: 'saline', n: '04', title: 'High-TDS, saline water', where: 'Chandanpur, Puri',
      problem: 'Brackish water with a lot of dissolved salt tastes salty or bitter and scales appliances.',
      rows: [
        { label: 'TDS', unit: 'mg/L', before: '780', after: '450', change: '42.3%', down: true, limit: 'Max 500 / 2,000' },
        { label: 'Electrical conductivity', unit: 'µS/cm', before: '1,250', after: '720', change: '42.4%', down: true },
      ] as Row[],
      read: 'TDS came down to within the acceptable limit. Crystal is designed for supply up to 350 mg/L TDS, so water like this needs testing and pre-filtration first.',
    },
    {
      key: 'chlorine', n: '05', title: 'Municipal chlorinated water', where: 'Niladri Vihar, Bhubaneswar',
      problem: 'Chlorine keeps piped water clean on its way to you, and leaves a taste and smell behind.',
      rows: [
        { label: 'Free chlorine', unit: 'mg/L', before: '2.05', after: '<0.02', change: '>99.0%', down: true, limit: '0.2 / 1.0' },
      ] as Row[],
      read: 'Chlorine fell below the detection limit, and stayed under the 0.1 mg/L breakthrough mark for 6,000 litres of filter life.',
    },
  ],
  limits: [
    'These are DVINE’s own in-house tests. Results apply only to the samples, product configuration and operating conditions tested, and vary with source water and filter age.',
    'They do not establish removal of anything that was not analysed, and they do not by themselves establish any health benefit.',
    'A routine result with no E. coli or coliform in the treated sample is not a pathogen-reduction claim; that needs a separate controlled challenge study.',
    'The treated pH of 8.65 in alkaline mode is above the IS 10500 range by design. Use Ambient water for infants and for taking medicines.',
  ],
};
