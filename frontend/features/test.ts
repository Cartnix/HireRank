import { createClient } from "@/shared/utils/supabase/server";

export async function getCandidates() {
  const start = performance.now();
  
  const supabase = await createClient();
  const { data } = await supabase.from('candidates').select('*');
  
  const end = performance.now();
  console.log(`Supabase query took: ${end - start}ms`); // Посмотри в терминале консоли Next.js
  
  return data;
}