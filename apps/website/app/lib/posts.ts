import { cache } from 'react'
import type { Locale } from './i18n'
export type Post = { id:string;slug:string;type:'article'|'news';title:string;excerpt:string;category:string;author:string;coverUrl:string|null;publishedAt:string|null;updatedAt:string;content?:string;seoTitle?:string;seoDescription?:string;commentsEnabled?:boolean }
export type PostsPage = {data:Post[];total:number;page:number;limit:number}
const api=process.env.API_URL??'http://localhost:3000/v1'
export async function getPosts(locale:Locale, options:{type?:string;q?:string;page?:number;limit?:number;category?:string}={}):Promise<PostsPage> {
 const query=new URLSearchParams({locale,...Object.fromEntries(Object.entries(options).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)]))})
 const response=await fetch(`${api}/posts/?${query}`,{cache:'no-store'})
 if(!response.ok)throw new Error('Could not load posts')
 return response.json()
}
export const getPost=cache(async(slug:string,locale:Locale):Promise<Post|null>=>{
 const response=await fetch(`${api}/posts/${encodeURIComponent(slug)}?locale=${locale}`,{cache:'no-store'})
 if(response.status===404)return null
 if(!response.ok)throw new Error('Could not load post')
 return ((await response.json()) as {data:Post}).data
})
export function postHref(post:Post,locale:Locale) {return `/${locale}/${post.type==='news'?'news':'blog'}/${post.slug}`}
export function postDate(value:string|null,locale:Locale) {return value?new Intl.DateTimeFormat(locale==='ar'?'ar-EG':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Africa/Cairo'}).format(new Date(value)):''}
