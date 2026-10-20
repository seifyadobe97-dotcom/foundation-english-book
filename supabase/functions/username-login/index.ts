// Public entry point for STEP username + password login.
// Keep SUPABASE_SERVICE_ROLE_KEY ONLY in Supabase Edge Function secrets.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const originAllow = new Set([
  "https://seifyadobe97-dotcom.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const allowed = originAllow.has(origin);
  const cors: Record<string,string> = {
    "Access-Control-Allow-Origin": allowed ? origin : "https://seifyadobe97-dotcom.github.io",
    "Vary":"Origin",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
  };
  const reply = (status:number, body:unknown) => new Response(JSON.stringify(body),{status,headers:cors});
  if (request.method === "OPTIONS") return new Response(null,{headers:cors});
  if (!allowed) return reply(403,{error:"Origin not permitted"});
  if (request.method !== "POST") return reply(405,{error:"Method not allowed"});
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return reply(503,{error:"Service not configured"});
  try {
    const raw = await request.text();
    if (raw.length > 4096) return reply(413,{error:"Request too large"});
    const input = JSON.parse(raw);
    const username = String(input.username ?? "").trim().toLowerCase();
    const password = String(input.password ?? "");
    if (!/^[a-z][a-z0-9_]{2,23}$/.test(username) || password.length < 8 || password.length > 256) {
      return reply(401,{error:"اسم المستخدم أو كلمة المرور غير صحيحة"});
    }
    const admin = createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:profile,error:profileError} = await admin.from("step_student_profiles").select("user_id,is_active").eq("username",username).maybeSingle();
    if (profileError || !profile) return reply(401,{error:"اسم المستخدم أو كلمة المرور غير صحيحة"});
    const {data:userData,error:userError} = await admin.auth.admin.getUserById(profile.user_id);
    if (userError || !userData.user?.email) return reply(401,{error:"اسم المستخدم أو كلمة المرور غير صحيحة"});
    const auth = createClient(SUPABASE_URL,ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:session,error:signInError} = await auth.auth.signInWithPassword({
      email:userData.user.email,password,
    });
    if (signInError || !session.session) return reply(401,{error:"اسم المستخدم أو كلمة المرور غير صحيحة أو البريد لم يتم تأكيده"});
    if(profile.is_active===false)return reply(403,{error:"الحساب موقوف مؤقتًا، تواصل مع إدارة المعهد"});
    return reply(200,{
      access_token:session.session.access_token,
      refresh_token:session.session.refresh_token,
      expires_in:session.session.expires_in,
      token_type:session.session.token_type,
    });
  } catch {
    return reply(400,{error:"تعذر إكمال تسجيل الدخول"});
  }
});
