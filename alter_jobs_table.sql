-- ====================================================================
-- SQL Script for Airport Transfer Jobs Database Table Update
-- ยินดีต้อนรับ! ให้คัดลอกคำสั่งด้านล่างนี้ไปวางใน SQL Editor ของระบบฐานข้อมูล (Supabase Dashboard) แล้วกด Run
-- ====================================================================

-- 1. เพิ่มฟิลด์ 'is_external' เพื่อระบุรอบวิ่งภายนอกแบบแมนนวล (ไม่ต้องการหักภาษี 5%)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT FALSE;

-- 2. เพิ่มฟิลด์ 'notes' สำหรับระบุหมายเหตุ/ข้อตกลงแมนนวลเพิ่มเติม
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT;

-- ตรวจสอบโครงสร้างตารางหลังแก้ไข (ตัวเลือกเสริม):
-- SELECT * FROM jobs LIMIT 1;
