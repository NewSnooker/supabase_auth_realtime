/* eslint-disable no-unused-vars */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: "implicit",
  },
});

export const uploadImage = async (file) => {
  try {
    // อัปโหลดรูปภาพไปยัง bucket
    const imageName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucketName) // ชื่อ bucket
      .upload(`${imageName}`, file, {
        upsert: false,
      });

    if (error) {
      console.error("Error during upload:", error);
      throw error;
    }

    const publicURL = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${imageName}`;
    console.log(publicURL);

    return publicURL;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดใน uploadImage:", error);
    throw error;
  }
};
