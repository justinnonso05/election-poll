declare module '@getbrevo/brevo' {
  export class TransactionalEmailsApi {
    authentications?: {
      apiKey?: {
        apiKey?: string;
      };
    };
    sendTransacEmail(email: SendSmtpEmail): Promise<{ body: any; messageId: string }>;
  }

  export class SendSmtpEmail {
    sender?: { email: string; name: string };
    to?: { email: string; name: string }[];
    subject?: string;
    htmlContent?: string;
    textContent?: string;
  }
}
