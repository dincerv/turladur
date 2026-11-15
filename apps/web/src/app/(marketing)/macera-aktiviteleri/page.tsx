import { redirect } from 'next/navigation';

/** Legacy navbar shortcut — macera aktiviteleri. */
export default function MaceraAktiviteleriRedirectPage() {
  redirect('/activities?category=macera');
}
