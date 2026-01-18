export interface VoterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  password: string;
  electionTitle?: string;
  loginUrl: string;
}

export function generateVoterCredentialsEmail(data: VoterCredentials): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = `Your Voting Credentials - ${data.electionTitle || 'Election Poll'}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
          border-top: none;
        }
        .credentials-box {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #667eea;
        }
        .credential-item {
          margin: 10px 0;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        .credential-label {
          font-weight: bold;
          color: #667eea;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🗳️ Your Voting Credentials</h1>
      </div>
      <div class="content">
        <p>Hello <strong>${data.firstName} ${data.lastName}</strong>,</p>
        
        <p>Your voter account has been created successfully. Please find your login credentials below:</p>
        
        <div class="credentials-box">
          <div class="credential-item">
            <span class="credential-label">Email:</span> ${data.email}
          </div>
          <div class="credential-item">
            <span class="credential-label">Student ID:</span> ${data.studentId}
          </div>
          <div class="credential-item">
            <span class="credential-label">Password:</span> ${data.password}
          </div>
        </div>
        
        <p><strong>⚠️ Important:</strong> Please keep these credentials safe and do not share them with anyone.</p>
        
        <center>
          <a href="${data.loginUrl}" class="button">Login to Vote</a>
        </center>
        
        <p>If you have any questions or issues, please contact the election administrator.</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} Election Poll. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Your Voting Credentials

Hello ${data.firstName} ${data.lastName},

Your voter account has been created successfully. Please find your login credentials below:

Email: ${data.email}
Student ID: ${data.studentId}
Password: ${data.password}

⚠️ Important: Please keep these credentials safe and do not share them with anyone.

Login URL: ${data.loginUrl}

If you have any questions or issues, please contact the election administrator.

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Election Poll. All rights reserved.
  `;

  return { subject, htmlContent, textContent };
}
