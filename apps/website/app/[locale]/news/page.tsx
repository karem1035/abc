import type { Locale } from '@/lib/i18n'
import { PostList } from '../components/posts/post-list'
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) { const {locale}=await params;return {title:locale==='ar'?'أخبار المستشفى':'Hospital news'} }
export default async function Page({params,searchParams}:{params:Promise<{locale:Locale}>;searchParams:Promise<{q?:string;page?:string;category?:string}>}) {const {locale}=await params;return <PostList locale={locale} type="news" search={await searchParams}/>}
