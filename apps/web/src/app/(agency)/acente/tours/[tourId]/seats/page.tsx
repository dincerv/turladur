import { AcenteTourSeatsHubPage } from '@/components/features/acente-tours/acente-tour-seats-hub-page';

export default async function Page({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  return <AcenteTourSeatsHubPage tourId={tourId} />;
}
