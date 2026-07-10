-- Add plan_interest to subscribers so pricing-page signups record intent.
ALTER TABLE subscribers ADD COLUMN plan_interest TEXT;
