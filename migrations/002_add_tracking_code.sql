-- Add tracking_code column to parcels table
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS tracking_code VARCHAR;

-- Create unique index on tracking_code
CREATE UNIQUE INDEX IF NOT EXISTS parcels_tracking_code_idx ON parcels(tracking_code);

-- Generate tracking codes for existing parcels (if any)
-- Note: This is a one-time migration script
DO $$
DECLARE
    parcel_record RECORD;
    new_code VARCHAR;
    code_exists BOOLEAN;
BEGIN
    FOR parcel_record IN SELECT id FROM parcels WHERE tracking_code IS NULL LOOP
        LOOP
            -- Generate a random tracking code: GTW-XXXXXX
            new_code := 'GTW-' || 
                        chr(65 + floor(random() * 24)::int) ||
                        chr(65 + floor(random() * 24)::int) ||
                        chr(65 + floor(random() * 24)::int) ||
                        chr(50 + floor(random() * 8)::int) ||
                        chr(50 + floor(random() * 8)::int) ||
                        chr(50 + floor(random() * 8)::int);
            
            -- Check if code already exists
            SELECT EXISTS(SELECT 1 FROM parcels WHERE tracking_code = new_code) INTO code_exists;
            
            -- If code doesn't exist, update the parcel and exit loop
            IF NOT code_exists THEN
                UPDATE parcels SET tracking_code = new_code WHERE id = parcel_record.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;
