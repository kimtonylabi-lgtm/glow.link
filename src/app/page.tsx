import { getTrendPortalData } from '@/lib/news'
import { EXHIBITION_SCHEDULES } from '@/lib/data/exhibitions'
import LandingPageClient from '@/components/LandingPageClient'

export default async function LandingPage() {
  // 1. Fetch News Data (Server-side)
  const newsData = await getTrendPortalData();

  // 2. Process Exhibition Data
  const now = new Date();
  const upcomingExhibitions = EXHIBITION_SCHEDULES
    .filter(ex => new Date(ex.endDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <LandingPageClient
      newsData={newsData}
      upcomingExhibitions={upcomingExhibitions}
    />
  );
}
