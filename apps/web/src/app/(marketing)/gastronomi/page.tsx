import { redirect } from 'next/navigation';

/** Legacy navbar shortcut — gastronomi kategorisi. */
export default function GastronomiRedirectPage() {
  redirect('/activities?category=gastronomi');
}
