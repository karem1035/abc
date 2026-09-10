import { staticSlugs } from '@/lib/static-content'
import type { Locale } from '@/lib/i18n'
import { PostDetail, postMetadata } from '../../components/posts/post-detail'
type Props={params:Promise<{locale:Locale;slug:string}>}
export async function generateMetadata({params}:Props) {const {locale,slug}=await params;return postMetadata(slug,locale,'news')}
export default async function Page({params}:Props) {const {locale,slug}=await params;return <PostDetail locale={locale} slug={slug} type="news"/>}

export const revalidate = 300
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return staticSlugs('posts?type=news', params.locale)
}
