import Link from 'next/link'
import { Search, BookOpen } from 'lucide-react'
import { getPosts } from '@/lib/posts'
import type { Locale } from '@/lib/i18n'
import { DirectoryHeader } from '../directory/directory-header'
import { PostCards } from './post-cards'
export async function PostList({locale,type,search}:{locale:Locale;type:'article'|'news';search:{q?:string;page?:string;category?:string}}) {
 const ar=locale==='ar';const page=Math.max(1,Math.min(10000,Number.parseInt(search.page??'1',10)||1));const q=(search.q??'').slice(0,100);const category=(search.category??'').slice(0,100);const base=`/${locale}/${type==='news'?'news':'blog'}`
 let result
 try {result=await getPosts(locale,{type,page,q,category:category||undefined,limit:9})}catch{return <div className="hospital-container hospital-directory-empty"><h1>{ar?'تعذر تحميل المنشورات':'Unable to load posts'}</h1><p>{ar?'يرجى المحاولة مرة أخرى بعد قليل.':'Please try again in a moment.'}</p><Link href={base}>{ar?'إعادة المحاولة':'Try again'}</Link></div>}
 const pageHref=(next:number)=>`${base}?${new URLSearchParams({q,category,page:String(next)})}`
 return <div className="hospital-directory"><DirectoryHeader locale={locale} title={type==='news'?(ar?'أخبار المستشفى':'Hospital news'):(ar?'المدونة والمقالات الطبية':'Health articles & blog')} label={ar?'معلومات تهمك':'INFORMATION FOR YOU'} description={type==='news'?(ar?'آخر الأخبار والفعاليات والتحديثات من مستشفى ABC.':'The latest news, events, and updates from ABC Hospital.'):(ar?'مقالات ومعلومات صحية يشاركها فريق المستشفى لمساعدتك على فهم رعايتك.':'Health articles and information shared by our hospital team to help you understand your care.')}/>
 <section className="hospital-container latest-posts"><div className="post-toolbar"><nav aria-label={ar?'نوع المنشورات':'Post type'}><Link href={`/${locale}/blog`} aria-current={type==='article'?'page':undefined}>{ar?'المقالات':'Articles'}</Link><Link href={`/${locale}/news`} aria-current={type==='news'?'page':undefined}>{ar?'الأخبار':'News'}</Link></nav><form action={base} className="post-search"><label htmlFor="post-search" className="sr-only">{ar?'بحث':'Search'}</label><input id="post-search" name="q" defaultValue={q} maxLength={100} placeholder={ar?'ابحث عن موضوع…':'Search a topic…'}/>{category&&<input type="hidden" name="category" value={category}/>}<button aria-label={ar?'بحث':'Search'}><Search size={20}/></button></form></div>
 {category&&<p className="mb-5">{category} · <Link href={base}>{ar?'إزالة التصنيف':'Clear category'}</Link></p>}
 {result.data.length?<PostCards posts={result.data} locale={locale}/>:<div className="hospital-directory-empty"><BookOpen size={35}/><h2>{q?(ar?'لا توجد نتائج':'No matching posts'):(ar?'لا توجد منشورات حالياً':'No posts published yet')}</h2><p>{ar?'تصفح الأخبار أو عد قريباً للاطلاع على جديدنا.':'Explore our news or check back for updates.'}</p>{q&&<Link href={base}>{ar?'مسح البحث':'Clear search'}</Link>}</div>}
 {result.total>9&&<nav className="post-pagination" aria-label={ar?'صفحات النتائج':'Pagination'}>{page>1&&<Link href={pageHref(page-1)}>{ar?'السابق':'Previous'}</Link>}<span>{page} / {Math.ceil(result.total/9)}</span>{page*9<result.total&&<Link href={pageHref(page+1)}>{ar?'التالي':'Next'}</Link>}</nav>}
 </section></div>
}
