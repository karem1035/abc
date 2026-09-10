import type { Locale } from '@/lib/i18n'
import { PostList } from '../components/posts/post-list'
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) { const {locale}=await params;return {title:locale==='ar'?'المدونة والمقالات الطبية':'Health articles & blog'} }
export default async function Page({params}:{params:Promise<{locale:Locale}>}) {const {locale}=await params;return <PostList locale={locale} type="article"/>}
