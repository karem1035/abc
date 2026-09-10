import { contentFetch } from '@/lib/content-fetch'
import Link from 'next/link'
import { Phone, ShieldCheck } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { site } from '@/lib/site'
import { DirectoryHeader } from '../components/directory/directory-header'
import { InsuranceDirectory, type Partner } from '../components/insurance-directory'
import { LatestPosts } from '../components/posts/post-cards'
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}) {const {locale}=await params;return {title:locale==='ar'?'التأمين والتعاقدات':'Insurance & corporate partners'}}
export default async function InsurancePage({params}:{params:Promise<{locale:Locale}>}) {
 const {locale}=await params;const ar=locale==='ar';let partners:Partner[]=[];let failed=false
 try{const res=await contentFetch(`${process.env.API_URL??'http://localhost:3000/v1'}/content/partners?locale=${locale}`,{next:{revalidate:60}});if(!res.ok)throw new Error();partners=(await res.json()).data}catch{failed=true}
 return <div className="hospital-directory"><DirectoryHeader locale={locale} title={ar?'التأمين والتعاقدات':'Insurance & corporate partners'} label={ar?'رعاية أقرب إليك':'HELPING YOU ACCESS CARE'} description={ar?'تعرّف على شركات التأمين والجهات المتعاقدة مع مستشفى ABC، وتواصل معنا للاستفسار قبل زيارتك.':'Explore the insurers and organizations partnered with ABC Hospital, and contact our team before your visit.'}/><section className="hospital-container insurance-content"><div className="insurance-note"><ShieldCheck size={30}/><div><h2>{ar?'تحقق من التغطية قبل زيارتك':'Check your coverage before visiting'}</h2><p>{ar?'هذه القائمة للتعريف بجهات التعاقد. قد تختلف التغطية حسب وثيقتك والخدمة المطلوبة، ويُرجى التواصل معنا للتأكد.':'This directory identifies our partners. Coverage can vary by your plan and the service you need. Please contact us to confirm.'}</p></div></div>{failed?<div className="hospital-directory-empty"><p>{ar?'تعذر تحميل جهات التعاقد. يرجى المحاولة لاحقاً أو الاتصال بنا.':'We couldn’t load the partner directory. Please try later or call us.'}</p></div>:<InsuranceDirectory partners={partners} locale={locale}/>}<div className="insurance-help"><div><p className="hospital-eyebrow">{ar?'يسعدنا مساعدتك':'WE’RE HERE TO HELP'}</p><h2>{ar?'لديك استفسار عن تعاقدك؟':'Have a question about your coverage?'}</h2><p>{ar?'تواصل مع فريقنا قبل ترتيب موعدك.':'Speak with our team before arranging your appointment.'}</p></div><div><a href={`tel:${site.hotline}`}><Phone size={18}/><span dir="ltr">{site.hotline}</span></a><Link href={`/${locale}/contact`}>{ar?'تواصل معنا':'Contact us'}</Link></div></div></section><LatestPosts locale={locale}/></div>
}
