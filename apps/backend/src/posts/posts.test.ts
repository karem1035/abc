import { describe, expect, test } from 'bun:test'
import { cleanPostHtml, postInput } from './validation'
test('sanitizes rich text',()=>{const html=cleanPostHtml('<h2>Title</h2><p onclick="x()">Text<strong>bold</strong></p><script>x()</script><a href="javascript:x()">link</a><img src=x onerror=x()>');expect(html).toContain('<strong>bold</strong>');expect(html).not.toMatch(/script|onclick|onerror|javascript|<img/)})
test('requires both bodies for publication',()=>{expect(postInput.safeParse({slug:'test',type:'article',titleAr:'عنوان',titleEn:'Title',contentAr:'<script>x</script>',contentEn:'<p>Text</p>',status:'published',coverUrl:'https://example.com/c.jpg'}).success).toBe(false)})
describe.skipIf(process.env.RUN_POST_INTEGRATION!=='1')('local API integration',()=>{
 test('roles, publication, translations and search',async()=>{
 const {default:router}=await import('./routes');const {db}=await import('../db/client');const {users,posts,auditLogs}=await import('../db/schema');const {eq,inArray}=await import('drizzle-orm');const {signAccessToken}=await import('../lib/jwt')
 const suffix=crypto.randomUUID();const ids:string[]=[];let postId=''
 const req=(path:string,method='GET',body?:unknown,token?:string)=>router.request(path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined})
 try {
 for(const role of ['marketer','call_center'] as const){const [u]=await db.insert(users).values({name:'Post integration test',username:`posts-${role}-${suffix}`,passwordHash:'no-login-test',role}).returning();ids.push(u.id)}
 const token=await signAccessToken({sub:ids[0],role:'marketer'});const caller=await signAccessToken({sub:ids[1],role:'call_center'})
 expect((await req('/admin/')).status).toBe(401);expect((await req('/admin/','GET',undefined,caller)).status).toBe(403)
 const body={slug:`test-${suffix}`,type:'article',titleAr:'عنوان الاختبار',titleEn:`Integration ${suffix}`,contentAr:'<p>محتوى عربي</p>',contentEn:'<h2>English</h2><script>bad()</script>',status:'draft'}
 let response=await req('/admin/','POST',body,token);expect(response.status).toBe(200);postId=(await response.json()).id
 expect((await req(`/${body.slug}?locale=en`)).status).toBe(404);expect((await req('/admin/','POST',body,token)).status).toBe(409)
 expect((await req(`/admin/${postId}`,'PUT',{...body,status:'published'},token)).status).toBe(200)
 const en=await (await req(`/${body.slug}?locale=en`)).json();expect(en.data.title).toBe(body.titleEn);expect(en.data.content).not.toContain('script')
 expect((await (await req(`/${body.slug}?locale=ar`)).json()).data.title).toBe(body.titleAr)
 const list=await (await req(`/?locale=en&q=${suffix}&limit=1`)).json();expect(list.total).toBe(1)





 await req(`/admin/${postId}`,'PUT',{...body,status:'archived'},token);expect((await req(`/${body.slug}`)).status).toBe(404)
 expect((await req(`/admin/${postId}`,'DELETE',undefined,token)).status).toBe(200);postId=''
 } finally {if(postId)await db.delete(posts).where(eq(posts.id,postId));if(ids.length){await db.delete(auditLogs).where(inArray(auditLogs.actorId,ids));await db.delete(users).where(inArray(users.id,ids))}}
 },20000)
})
