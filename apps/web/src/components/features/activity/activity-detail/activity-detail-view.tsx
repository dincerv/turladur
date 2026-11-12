import Link from 'next/link';
import {
  BadgeCheck,
  BookOpen,
  ChevronRight,
  ListChecks,
  MapPinned,
  Route,
  Sparkles,
} from 'lucide-react';
import MembershipBadge from '@/components/features/tour/membership-badge';
import { ActivityListingCard } from '../activities-page/activity-listing-card';
import type { Experience } from '../activities-page/activities-page.types';
import { ActivityBookingPanel } from './activity-booking-panel';
import {
  ActivityMeetingPointCard,
  ActivityOperatorCard,
  ActivitySchedule,
} from './activity-detail-blocks';
import { ActivityDetailActions } from './activity-detail-actions';
import { ActivityDetailMedia } from './activity-detail-media';
import { ActivityDetailSection } from './activity-detail-section';
import { formatPrice, getStartingPrice } from './activity-detail.helpers';
import type { ActivityDetail, ActivitySession } from './activity-detail.types';
import { ActivityKeyFacts } from './activity-key-facts';
import { ContentRenderer } from './content-renderer';
import { FeatureList } from './feature-list';

interface ActivityDetailViewProps {
  activity: ActivityDetail;
  sessions: readonly ActivitySession[];
  related: readonly Experience[];
}

export function ActivityDetailView({
  activity,
  sessions,
  related,
}: ActivityDetailViewProps) {
  const startingPrice = getStartingPrice(activity, sessions);
  const hasInclusions =
    activity.included.length > 0 || activity.notIncluded.length > 0;
  const hasDetails =
    activity.highlights.length > 0 ||
    Boolean(activity.longDescription) ||
    activity.schedule.length > 0 ||
    hasInclusions ||
    activity.meetingPoint != null;

  return (
    <div className="bg-neutral-50/60 pb-28 lg:pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8 lg:pt-28">
        <nav
          aria-label="Sayfa konumu"
          className="mb-4 min-w-0 text-sm text-neutral-500"
        >
          <ol className="flex min-w-0 items-center gap-1">
            <li className="shrink-0">
              <Link href="/" className="hover:text-neutral-900">
                Ana Sayfa
              </Link>
            </li>
            <li aria-hidden className="shrink-0">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li className="shrink-0">
              <Link href="/activities" className="hover:text-neutral-900">
                Aktiviteler
              </Link>
            </li>
            <li aria-hidden className="shrink-0">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li
              aria-current="page"
              className="min-w-0 truncate text-neutral-800"
            >
              {activity.title}
            </li>
          </ol>
        </nav>

        <header className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <ActivityDetailMedia
            images={activity.images}
            title={activity.title}
          />

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {activity.category ? (
                  <span className="max-w-full truncate rounded-md bg-sky-600 px-2.5 py-1 text-xs font-semibold tracking-wide text-white">
                    {activity.category}
                  </span>
                ) : null}
                <MembershipBadge tier={activity.operator?.membershipTier} />
              </div>
              <ActivityDetailActions
                activityId={activity.id}
                title={activity.title}
              />
            </div>

            <h1 className="text-balance break-words text-2xl font-bold leading-tight tracking-tight text-neutral-900 [overflow-wrap:anywhere] sm:text-3xl lg:text-[2.25rem] lg:leading-[1.15]">
              {activity.title}
            </h1>

            {activity.summary ? (
              <p className="max-w-prose whitespace-pre-line break-words text-base leading-relaxed text-neutral-600 [overflow-wrap:anywhere]">
                {activity.summary}
              </p>
            ) : null}

            <ActivityKeyFacts activity={activity} />

            {/* With sessions, mobile price lives in the fixed CTA; desktop in the sidebar. */}
            {sessions.length === 0 ? (
              <div className="mt-1 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm lg:hidden">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Kişi başı başlayan
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-neutral-900">
                    {startingPrice != null
                      ? formatPrice(startingPrice, activity.currency)
                      : 'Fiyat sorunuz'}
                  </p>
                </div>
                <a
                  href="#tarihler"
                  className="inline-flex min-h-12 items-center rounded-xl border border-neutral-300 px-5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  Uygunluk
                </a>
              </div>
            ) : null}
          </div>
        </header>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <div className="min-w-0 space-y-6">
            {activity.highlights.length > 0 ? (
              <ActivityDetailSection
                id="one-cikanlar"
                title="Öne çıkanlar"
                icon={Sparkles}
              >
                <FeatureList
                  items={activity.highlights}
                  variant="highlight"
                  columns={2}
                />
              </ActivityDetailSection>
            ) : null}

            {activity.longDescription ? (
              <ActivityDetailSection
                id="hakkinda"
                title="Aktivite hakkında"
                icon={BookOpen}
              >
                <ContentRenderer text={activity.longDescription} />
              </ActivityDetailSection>
            ) : null}

            {activity.schedule.length > 0 ? (
              <ActivityDetailSection id="program" title="Program" icon={Route}>
                <ActivitySchedule items={activity.schedule} />
              </ActivityDetailSection>
            ) : null}

            {hasInclusions ? (
              <ActivityDetailSection
                id="dahil"
                title="Fiyata neler dâhil?"
                icon={ListChecks}
              >
                <div className="grid gap-6 md:grid-cols-2">
                  {activity.included.length > 0 ? (
                    <div className="min-w-0">
                      <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                        Dâhil
                      </h3>
                      <FeatureList
                        items={activity.included}
                        variant="included"
                      />
                    </div>
                  ) : null}
                  {activity.notIncluded.length > 0 ? (
                    <div className="min-w-0">
                      <h3 className="mb-3 text-sm font-semibold text-rose-700">
                        Dâhil değil
                      </h3>
                      <FeatureList
                        items={activity.notIncluded}
                        variant="excluded"
                      />
                    </div>
                  ) : null}
                </div>
              </ActivityDetailSection>
            ) : null}

            {activity.meetingPoint ? (
              <ActivityDetailSection
                id="bulusma"
                title="Buluşma noktası"
                icon={MapPinned}
              >
                <ActivityMeetingPointCard point={activity.meetingPoint} />
              </ActivityDetailSection>
            ) : null}

            {!hasDetails ? (
              <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm leading-relaxed text-neutral-600">
                Program ve kapsam detayları sağlayıcı tarafından henüz
                eklenmedi. Tarih seçip rezervasyon adımında güncel bilgileri
                görebilirsiniz.
              </p>
            ) : null}

            {activity.operator ? (
              <ActivityDetailSection
                id="saglayici"
                title="Aktivite sağlayıcısı"
                icon={BadgeCheck}
              >
                <ActivityOperatorCard operator={activity.operator} />
              </ActivityDetailSection>
            ) : null}
          </div>

          <aside
            id="tarihler"
            aria-label="Rezervasyon"
            className="scroll-mt-24 lg:sticky lg:top-24"
          >
            <ActivityBookingPanel
              activityId={activity.id}
              title={activity.title}
              currency={activity.currency}
              startingPrice={startingPrice}
              ageRestrictionLabel={activity.ageRestrictionLabel}
              sessions={sessions}
            />
          </aside>
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="benzer-heading" className="mt-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2
                id="benzer-heading"
                className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl"
              >
                Benzer aktiviteler
              </h2>
              <Link
                href="/activities"
                className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-sky-700 hover:text-sky-800"
              >
                Tümünü gör
                <ChevronRight aria-hidden className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((exp) => (
                <ActivityListingCard key={exp.id} experience={exp} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
