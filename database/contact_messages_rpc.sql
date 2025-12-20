-- ============================================================================
-- Contact Messages RPC Functions
-- Purpose: Bypass schema cache issues with PGRST204 errors
-- ============================================================================

-- RPC Function to insert contact message (bypasses schema cache)
CREATE OR REPLACE FUNCTION public.insert_contact_message_raw(
  user_id_param UUID,
  user_email_param TEXT,
  subject_param TEXT,
  message_param TEXT,
  message_type_param TEXT,
  app_version_param TEXT,
  platform_param TEXT
)
RETURNS TABLE(id UUID) AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.contact_messages (
    user_id,
    user_email,
    subject,
    message,
    message_type,
    app_version,
    platform,
    status
  )
  VALUES (
    user_id_param,
    user_email_param,
    subject_param,
    message_param,
    message_type_param,
    app_version_param,
    platform_param,
    'pending'
  )
  RETURNING contact_messages.id INTO new_id;
  
  RETURN QUERY SELECT new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_contact_message_raw(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) 
  TO authenticated, service_role;

-- ============================================================================
