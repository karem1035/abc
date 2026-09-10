import { HomeHero } from './components/home-hero'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: 'ar' | 'en' }>
}) {
  const { locale } = await params
  return <HomeHero locale={locale} />
}
