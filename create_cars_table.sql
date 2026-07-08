-- SQL Command to create the 'cars' table in Supabase PostgreSQL
-- Go to your Supabase Dashboard -> SQL Editor -> New Query, paste this script and click Run.

CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  brand VARCHAR(100) NOT NULL,
  license_plate VARCHAR(50) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial 3 cars as requested
INSERT INTO cars (code, brand, license_plate, image_url)
VALUES 
  ('D1299', 'Toyota Camry 7-Seater', '3กข 1299 กรุงเทพฯ', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=60'),
  ('D6662', 'Toyota Camry Deluxe', '5กข 6662 กรุงเทพฯ', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=60'),
  ('D6762', 'Toyota Fortuner SUV', '7กข 6762 กรุงเทพฯ', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=60')
ON CONFLICT (code) 
DO UPDATE SET 
  brand = EXCLUDED.brand,
  license_plate = EXCLUDED.license_plate,
  image_url = EXCLUDED.image_url;
