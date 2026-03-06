CREATE OR REPLACE FUNCTION update_restaurant_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location :=
      ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude),4326)::geography;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_restaurant_location
BEFORE INSERT OR UPDATE OF latitude, longitude
ON "Restaurant"
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_location();