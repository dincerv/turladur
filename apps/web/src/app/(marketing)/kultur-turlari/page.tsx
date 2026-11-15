import { redirect } from 'next/navigation';

/** Legacy navbar shortcut — kültür turları. */
export default function KulturTurlariRedirectPage() {
  redirect('/tours?category=CULTURAL');
}
