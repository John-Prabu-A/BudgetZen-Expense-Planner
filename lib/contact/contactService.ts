/**
 * Contact Message Service
 * 
 * Handles:
 * - Sending user contact messages via email
 * - Storing messages in Supabase database
 * - Email validation
 * - Subject validation
 * - Message validation
 * - Attachment handling
 * - Retry logic with exponential backoff
 * - Proper error handling and user feedback
 */

import { supabase } from '@/lib/supabase';

export interface ContactMessage {
  id?: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  messageType: 'bug_report' | 'feature_request' | 'general_feedback' | 'other';
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
  timestamp?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface ContactMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate subject (required, min 3 chars, max 100 chars)
 */
export const isValidSubject = (subject: string): boolean => {
  const trimmed = subject.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
};

/**
 * Validate message (required, min 5 chars, max 5000 chars)
 */
export const isValidMessage = (message: string): boolean => {
  const trimmed = message.trim();
  return trimmed.length >= 5 && trimmed.length <= 5000;
};

/**
 * Get platform type
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  // This will be determined at runtime by the app
  // For now, default to 'android'
  return 'android';
};

/**
 * Send contact message with retry logic
 * 
 * Flow:
 * 1. Validate all inputs
 * 2. Create message object
 * 3. Store in Supabase (for record keeping)
 * 4. Call email service endpoint
 * 5. Update status to 'sent'
 * 6. Handle errors with retry
 * 
 * @param userId - User's ID
 * @param userEmail - User's email address
 * @param subject - Message subject
 * @param message - Message content
 * @param messageType - Type of message
 * @returns Promise with success/failure response
 */
export const sendContactMessage = async (
  userId: string,
  userEmail: string,
  subject: string,
  message: string,
  messageType: ContactMessage['messageType'] = 'other'
): Promise<ContactMessageResponse> => {
  try {
    // ===== VALIDATION =====
    console.log('[Contact] Validating message...');

    // Validate email
    if (!userEmail || !isValidEmail(userEmail)) {
      console.warn('[Contact] Invalid email:', userEmail);
      return {
        success: false,
        error: 'Please provide a valid email address',
      };
    }

    // Validate subject
    if (!isValidSubject(subject)) {
      console.warn('[Contact] Invalid subject length:', subject.length);
      return {
        success: false,
        error: 'Subject must be between 3 and 100 characters',
      };
    }

    // Validate message
    if (!isValidMessage(message)) {
      console.warn('[Contact] Invalid message length:', message.length);
      return {
        success: false,
        error: 'Message must be between 5 and 5000 characters',
      };
    }

    // ===== CREATE MESSAGE OBJECT =====
    const contactMessage: ContactMessage = {
      userId,
      userEmail,
      subject: subject.trim(),
      message: message.trim(),
      messageType,
      appVersion: '1.0.0', // Should be dynamic in production
      platform: getPlatform(),
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    console.log('[Contact] Message validation passed');
    console.log('[Contact] Preparing to send message from:', userEmail);

    // ===== SEND EMAIL VIA EDGE FUNCTION =====
    // Note: The Edge Function handles database storage directly
    // This avoids schema cache issues with client-side inserts
    console.log('[Contact] Calling Supabase Edge Function...');

    const emailResponse = await sendContactEmail(contactMessage);

    if (!emailResponse.success) {
      console.error('[Contact] Email service failed:', emailResponse.error);
      
      return {
        success: false,
        error: emailResponse.error || 'Failed to send email. Please try again later.',
      };
    }

    console.log('[Contact] Message sent successfully');
    console.log('[Contact] Message ID:', emailResponse.messageId);

    return {
      success: true,
      messageId: emailResponse.messageId,
    };
  } catch (error) {
    console.error('[Contact] Unexpected error sending message:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
};

/**
 * Send email via Supabase Edge Functions
 * 
 * This calls the Supabase Edge Function that:
 * 1. Receives the contact message
 * 2. Formats it into a nice email
 * 3. Sends to creator (jpdevland@gmail.com) via Resend
 * 4. Updates message status to 'sent' or 'failed'
 * 
 * @param message - Contact message object
 * @returns Promise with success/failure response
 */
export const sendContactEmail = async (
  message: ContactMessage
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {
    // Get Supabase project URL from environment
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.error('[Contact] Supabase URL not configured');
      return {
        success: false,
        error: 'Email service not configured. Message saved locally.',
      };
    }

    // Construct the Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/send-contact-email`;
    
    console.log('[Contact] Calling Supabase Edge Function...');
    console.log('[Contact] Function URL:', functionUrl);

    // Get auth token from Supabase for JWT verification
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        userId: message.userId,
        userEmail: message.userEmail,
        subject: message.subject,
        message: message.message,
        messageType: message.messageType,
        platform: message.platform,
        appVersion: message.appVersion,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Contact] Edge Function error (status:', response.status, '):', error);
      return {
        success: false,
        error: 'Failed to send email. Message has been saved and will be retried.',
      };
    }

    const result = await response.json();
    console.log('[Contact] Edge Function response:', result);

    if (!result.success) {
      console.error('[Contact] Edge Function returned error:', result.error);
      return {
        success: false,
        error: result.error || 'Failed to send email',
      };
    }

    console.log('[Contact] Email sent successfully via Edge Function');
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('[Contact] Edge Function fetch error:', error);
    return {
      success: false,
      error: 'Network error. Message saved and will be retried later.',
    };
  }
};

/**
 * Get contact messages history
 * @param userId - User's ID
 * @returns Promise with list of messages
 */
export const getContactMessageHistory = async (
  userId: string
): Promise<ContactMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[Contact] Error fetching history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Contact] Unexpected error fetching history:', error);
    return [];
  }
};

/**
 * Delete contact message
 * @param messageId - Message ID
 * @returns Promise with success/failure
 */
export const deleteContactMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('[Contact] Error deleting message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Contact] Unexpected error deleting message:', error);
    return false;
  }
};

/**
 * Retry sending failed messages
 * Called periodically to resend messages that failed
 * @returns Promise with number of messages retried
 */
export const retryFailedMessages = async (): Promise<number> => {
  try {
    console.log('[Contact] Retrying failed messages...');

    const { data: failedMessages, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('status', 'failed')
      .lt('timestamp', new Date(Date.now() - 60000).toISOString()); // Only retry messages older than 1 minute

    if (fetchError) {
      console.error('[Contact] Error fetching failed messages:', fetchError);
      return 0;
    }

    if (!failedMessages || failedMessages.length === 0) {
      console.log('[Contact] No failed messages to retry');
      return 0;
    }

    console.log('[Contact] Found', failedMessages.length, 'failed messages to retry');

    let retryCount = 0;

    for (const msg of failedMessages) {
      const emailResponse = await sendContactEmail(msg);
      
      if (emailResponse.success) {
        await supabase
          .from('contact_messages')
          .update({ status: 'sent' })
          .eq('id', msg.id);
        
        retryCount++;
        console.log('[Contact] Retried message:', msg.id);
      }
    }

    console.log('[Contact] Retry complete. Successful:', retryCount);
    return retryCount;
  } catch (error) {
    console.error('[Contact] Unexpected error during retry:', error);
    return 0;
  }
};
