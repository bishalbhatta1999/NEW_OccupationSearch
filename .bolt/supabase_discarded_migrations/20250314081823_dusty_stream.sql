/*
  # Add Super Admin Role
  
  1. Updates
    - Updates user role to 'superAdmin' for specified email
    - Ensures proper access control for super admin features
*/

DO $$ 
BEGIN
  -- Update user role to superAdmin for the specified email
  UPDATE users 
  SET role = 'superAdmin',
      updated_at = CURRENT_TIMESTAMP
  WHERE email = 'marvic.g2687@gmail.com';

  -- Ensure the user has admin privileges
  UPDATE users
  SET is_admin = true,
      updated_at = CURRENT_TIMESTAMP
  WHERE email = 'marvic.g2687@gmail.com';
END $$;