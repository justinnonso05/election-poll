export interface VoterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  password: string;
  electionTitle?: string;
  loginUrl: string;
  logoUrl?: string | null;
  associationName?: string;
  startDate?: Date;
  endDate?: Date;
}

export function generateVoterCredentialsEmail(data: VoterCredentials): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = `Voting Credentials - ${data.associationName || 'Election Poll'}`;

  // Formatting dates
  const formatDate = (date?: Date) => {
    if (!date) return 'TBA';
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos', // Force GMT+1
    });
  };

  const startStr = formatDate(data.startDate);

  // Using the specific platform dark mode background color as accent
  const accentColor = '#080c18';
  const logoSection = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="${data.associationName || 'Logo'}" style="max-height: 80px; width: auto; display: block; margin: 0 auto;">`
    : `<h2 style="color: ${accentColor}; margin: 0;">${data.associationName || 'Election Poll'}</h2>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Voting Credentials</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header {
          text-align: center;
          padding: 40px 40px 20px 40px;
          background: #ffffff;
        }
        .content {
          padding: 20px 40px 40px 40px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }
        .credentials-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          text-align: center;
        }
        .credential-row {
          margin-bottom: 12px;
          font-size: 16px;
        }
        .credential-row:last-child {
          margin-bottom: 0;
        }
        .label {
          color: #64748b;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }
        .value {
          color: ${accentColor};
          font-family: "Courier New", Courier, monospace;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 1px;
        }
        .login-btn {
          display: inline-block;
          background-color: ${accentColor};
          color: #ffffff !important;
          padding: 16px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 10px 0 30px 0;
          text-align: center;
        }
        .election-info {
          background-color: #fff1f2; /* Very subtle red/alert tint or just white */
          background-color: #fff;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
        .info-title {
          font-weight: 600;
          color: ${accentColor};
          margin-bottom: 10px;
        }
        .time-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .note {
          font-size: 13px;
          color: #666;
          font-style: italic;
          margin-top: 15px;
          background-color: #f8fafc;
          padding: 10px;
          border-left: 3px solid ${accentColor};
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #94a3b8;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoSection}
        </div>
        
        <div class="content">
          <p class="greeting">Hello <strong>${data.firstName} ${data.lastName}</strong>,</p>
          
          <p>You have been registered to vote in the upcoming <strong>${data.associationName || 'Association'}</strong> election. Below are your secure login credentials.</p>
          
          <div class="credentials-card">
            <div class="credential-row">
              <span class="label">Student ID</span>
              <span class="value">${data.studentId}</span>
            </div>
            <div class="credential-row">
              <span class="label">One-Time Password</span>
              <span class="value">${data.password}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://naosspoll.vercel.app/" class="login-btn">Login to Vote</a>
          </div>
          
          <div class="election-info">
            <h3 class="info-title">📅 Election Schedule</h3>
            <p style="margin: 5px 0;"><strong>Starts:</strong> ${startStr}</p>
            
            <div class="note">
              <strong>Note:</strong> You will only be able to login and cast your vote during this period. Please plan accordingly.
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Secure Voting Platform</p>
          <p>&copy; ${new Date().getFullYear()} ${data.associationName || 'Election Poll'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Voting Credentials - ${data.associationName || 'Election Poll'}

Hello ${data.firstName} ${data.lastName},

You have been registered to vote in the upcoming ${data.associationName || 'Association'} election.

YOUR CREDENTIALS:
------------------
Student ID: ${data.studentId}
Password: ${data.password}
------------------

LOGIN HERE: https://naosspoll.vercel.app/

ELECTION SCHEDULE:
Starts: ${startStr}

NOTE: You will only be able to login and cast your vote during this period.

Secure Voting Platform
© ${new Date().getFullYear()} ${data.associationName || 'Election Poll'}
  `;

  return { subject, htmlContent, textContent };
}

// ─── Candidate Registration Receipt ───────────────────────────────────────────

export interface CandidateReceiptData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: string;
  positionName: string;
  electionTitle: string;
  associationName: string;
  associationDescription?: string;
  submittedAt: Date;
  logoUrl?: string | null;
}

export function generateCandidateReceiptEmail(data: CandidateReceiptData): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = `Candidate Registration Receipt — ${data.associationName}`;
  const accentColor = '#080c18';

  const formatDate = (date: Date) =>
    new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos',
    });

  const logoHtml = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="${data.associationName}" style="height:56px;width:auto;display:block;margin-bottom:10px;">`
    : '';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Candidate Registration Receipt</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#1a1a1a;margin:0;padding:0;background:#f4f4f5;}
      .container{max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.07);}
      .header{background:${accentColor};padding:28px 36px 22px;color:#fff;}
      .header-name{font-size:18px;font-weight:700;color:#fff;margin:0 0 2px;}
      .header-desc{font-size:12px;color:rgba(255,255,255,.65);margin:0;}
      .date-bar{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:8px 36px;font-size:12px;color:#64748b;text-align:right;}
      .content{padding:24px 36px 32px;}
      h1{font-size:15px;font-weight:700;color:${accentColor};margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px;}
      .subtitle{font-size:12px;color:#64748b;margin:0 0 18px;}
      table.details{width:100%;border-collapse:collapse;margin:14px 0 20px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;}
      table.details tr:last-child td{border-bottom:none;}
      table.details td{padding:9px 14px;font-size:13px;border-bottom:1px solid #f1f5f9;}
      table.details td:first-child{color:#64748b;width:40%;font-weight:600;background:#f8fafc;}
      table.details td:last-child{color:${accentColor};font-weight:700;}
      .note{font-size:12.5px;color:#555;font-style:italic;background:#f8fafc;border-left:3px solid ${accentColor};padding:10px 14px;border-radius:0 4px 4px 0;margin-top:4px;}
      .footer{text-align:center;padding:16px;font-size:11px;color:#94a3b8;background:#f8fafc;border-top:1px solid #e2e8f0;}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        ${logoHtml}
        <div class="header-name">${data.associationName}</div>
        ${data.associationDescription ? `<div class="header-desc">${data.associationDescription}</div>` : ''}
      </div>
      <div class="date-bar">${formatDate(data.submittedAt)}</div>
      <div class="content">
        <h1>Electoral Commission</h1>
        <p class="subtitle">Candidate Registration Receipt — ${data.electionTitle}</p>
        <p>Dear <strong>${data.firstName} ${data.lastName}</strong>,</p>
        <p>Your candidate registration form has been received. Your official e-form receipt is attached to this email as a PDF.</p>
        <table class="details">
          <tr><td>First Name</td><td>${data.firstName}</td></tr>
          <tr><td>Last Name</td><td>${data.lastName}</td></tr>
          <tr><td>Email</td><td>${data.email}</td></tr>
          <tr><td>Phone</td><td>${data.phone}</td></tr>
          <tr><td>Matric Number</td><td>${data.matricNumber}</td></tr>
          <tr><td>Level</td><td>${data.level} Level</td></tr>
          <tr><td>Position Applied</td><td>${data.positionName}</td></tr>
          <tr><td>Election</td><td>${data.electionTitle}</td></tr>
        </table>
        <div class="note">Please keep the attached PDF as proof of your registration. Further communication regarding screening will be sent separately.</div>
      </div>
      <div class="footer">
        <p>${data.associationName} Electoral Commission</p>
        <p>&copy; ${new Date().getFullYear()} ${data.associationName}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>`;

  const textContent = `
Candidate Registration Receipt — ${data.associationName}
${data.associationDescription ? data.associationDescription + '\n' : ''}
Date: ${formatDate(data.submittedAt)}

Dear ${data.firstName} ${data.lastName},

Your candidate registration has been received. Details:

First Name:    ${data.firstName}
Last Name:     ${data.lastName}
Email:         ${data.email}
Phone:         ${data.phone}
Matric Number: ${data.matricNumber}
Level:         ${data.level} Level
Position:      ${data.positionName}
Election:      ${data.electionTitle}

Please keep the attached PDF as proof of your registration.

${data.associationName} Electoral Commission
© ${new Date().getFullYear()} ${data.associationName}
  `.trim();

  return { subject, htmlContent, textContent };
}

// ─── Admin Credentials ───────────────────────────────────────────

export interface AdminCredentials {
  email: string;
  password: string;
  role: string;
  loginUrl: string;
  associationName?: string;
  logoUrl?: string | null;
}

export function generateAdminCredentialsEmail(data: AdminCredentials): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = `Admin Credentials - ${data.associationName || 'Election Poll'}`;
  const accentColor = '#080c18';

  const logoHtml = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="${data.associationName || 'Logo'}" style="max-height: 80px; width: auto; display: block; margin: 0 auto;">`
    : `<h2 style="color: ${accentColor}; margin: 0;">${data.associationName || 'Election Poll'}</h2>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Credentials</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header {
          text-align: center;
          padding: 40px 40px 20px 40px;
          background: #ffffff;
        }
        .content {
          padding: 20px 40px 40px 40px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }
        .credentials-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          text-align: center;
        }
        .credential-row {
          margin-bottom: 12px;
          font-size: 16px;
        }
        .credential-row:last-child {
          margin-bottom: 0;
        }
        .label {
          color: #64748b;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }
        .value {
          color: ${accentColor};
          font-family: "Courier New", Courier, monospace;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 1px;
        }
        .login-btn {
          display: inline-block;
          background-color: ${accentColor};
          color: #ffffff !important;
          padding: 16px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 10px 0 30px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #94a3b8;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoHtml}
        </div>
        
        <div class="content">
          <p class="greeting">Hello,</p>
          
          <p>You have been assigned the role of <strong>${data.role}</strong> for <strong>${data.associationName || 'Association'}</strong>. Below are your login credentials.</p>
          
          <div class="credentials-card">
            <div class="credential-row">
              <span class="label">Email</span>
              <span class="value">${data.email}</span>
            </div>
            <div class="credential-row">
              <span class="label">Password</span>
              <span class="value">${data.password}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${data.loginUrl}" class="login-btn">Login Now</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Secure Admin Platform</p>
          <p>&copy; ${new Date().getFullYear()} ${data.associationName || 'Election Poll'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Admin Credentials - ${data.associationName || 'Election Poll'}

Hello,

You have been assigned the role of ${data.role} for ${data.associationName || 'Association'}.

YOUR CREDENTIALS:
------------------
Email: ${data.email}
Password: ${data.password}
------------------

LOGIN HERE: ${data.loginUrl}

Secure Admin Platform
© ${new Date().getFullYear()} ${data.associationName || 'Election Poll'}
  `;

  return { subject, htmlContent, textContent };
}
