import * as brevo from '@getbrevo/brevo';

interface EmailData {
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  keyUsed?: string;
}

class BrevoEmailService {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private keyUsageCount: Map<string, number> = new Map();
  private readonly MAX_EMAILS_PER_KEY = 300; // Brevo free plan: 300 emails per day per account
  private readonly SENDER_EMAIL = 'noreply@duespay.app'; // Your verified domain
  private readonly SENDER_NAME = 'Election Poll';

  constructor() {
    // Load all Brevo API keys from environment
    this.apiKeys = [
      process.env.BREVO_API_KEY_CHI,
      process.env.BREVO_API_KEY_JUS,
      // Add more keys as needed
    ].filter((key): key is string => !!key);

    if (this.apiKeys.length === 0) {
      throw new Error('No Brevo API keys configured');
    }

    // Initialize usage count for each key
    this.apiKeys.forEach(key => {
      this.keyUsageCount.set(key, 0);
    });
  }

  /**
   * Get the next available API key using round-robin rotation
   */
  private getNextApiKey(): string {
    const key = this.apiKeys[this.currentKeyIndex];
    const usage = this.keyUsageCount.get(key) || 0;

    // If current key has reached limit, move to next key
    if (usage >= this.MAX_EMAILS_PER_KEY) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      const nextKey = this.apiKeys[this.currentKeyIndex];

      // Reset usage count if we've cycled through all keys
      if (this.currentKeyIndex === 0) {
        this.keyUsageCount.forEach((_, k) => this.keyUsageCount.set(k, 0));
      }

      return nextKey;
    }

    // Rotate to next key for next call (round-robin)
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;

    return key;
  }

  /**
   * Send a single email
   */
  async sendEmail(emailData: EmailData): Promise<SendEmailResult> {
    const apiKey = this.getNextApiKey();

    try {
      // Initialize API instance
      const apiInstance = new brevo.TransactionalEmailsApi();

      // Debug: Log the API key being used (first 15 chars only for security)
      console.log('🔑 Using API key:', apiKey.substring(0, 15) + '...');

      // Set API key using the correct pattern from Brevo documentation
      (apiInstance as any).authentications.apiKey.apiKey = apiKey;

      // Debug: Verify the key was set
      console.log('✅ Authentications object:', JSON.stringify((apiInstance as any).authentications, null, 2));

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: this.SENDER_EMAIL, name: this.SENDER_NAME };
      sendSmtpEmail.to = emailData.to;
      sendSmtpEmail.subject = emailData.subject;
      sendSmtpEmail.htmlContent = emailData.htmlContent;
      sendSmtpEmail.textContent = emailData.textContent;

      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

      // Increment usage count for this key
      const currentUsage = this.keyUsageCount.get(apiKey) || 0;
      this.keyUsageCount.set(apiKey, currentUsage + 1);

      return {
        success: true,
        messageId: response.messageId,
        keyUsed: apiKey.substring(0, 10) + '...', // For logging purposes
      };
    } catch (error: any) {
      console.error('Brevo email error:', error);
      console.error('Error response:', error.response?.data || error.response || 'No response data');
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send email',
        keyUsed: apiKey.substring(0, 10) + '...',
      };
    }
  }

  /**
   * Send bulk emails (one by one with key rotation)
   */
  async sendBulkEmails(emails: EmailData[]): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: SendEmailResult[];
  }> {
    const results: SendEmailResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get current key usage statistics
   */
  getKeyUsageStats() {
    return Array.from(this.keyUsageCount.entries()).map(([key, count]) => ({
      key: key.substring(0, 10) + '...',
      usage: count,
      limit: this.MAX_EMAILS_PER_KEY,
    }));
  }
}

// Export singleton instance
export const brevoEmailService = new BrevoEmailService();
