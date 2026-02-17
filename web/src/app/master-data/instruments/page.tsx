/**
 * Instrument Master Data Page (Server Component)
 *
 * Route: /master-data/instruments
 * Displays the instrument master data listing with search, filtering, and export.
 */

import InstrumentsClient from './InstrumentsClient';

export default function InstrumentsPage() {
  return <InstrumentsClient />;
}
