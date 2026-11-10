/**
 * JanSahayak AI - Automated Mailer Service
 * Dispatches welcoming & security alerts on user registration and login
 * with user details (Name, Email, DOB, IP) and platform visual guide.
 */

import { mockSentEmails } from './mockDataStore.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Builds the official JanSahayak AI HTML email template
 */
export function buildAuthEmailTemplate({ user, ipAddress, eventType }) {
  const isRegistration = eventType === 'registration';
  const formattedDob = user.dob
    ? new Date(user.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Not Specified';

  const currentTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const subject = isRegistration
    ? `🎉 Welcome to JanSahayak AI, ${user.full_name || 'Citizen'} - Registration Successful`
    : `🛡️ Security Alert: New Login to JanSahayak AI from ${ipAddress}`;

  const headerTitle = isRegistration
    ? 'Official Citizen Registration Confirmed'
    : 'Account Sign-In Security Notification';

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #080E1E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; }
    .email-wrapper { max-width: 620px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #0B1730 0%, #042F2E 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #14B8A6; }
    .logo-container { display: inline-flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; margin: 0; }
    .brand-title span { color: #14B8A6; }
    .brand-subtitle { font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 14px; background: rgba(20, 184, 166, 0.15); color: #2DD4BF; border: 1px solid rgba(20, 184, 166, 0.3); }
    .content { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 700; color: #FFFFFF; margin-top: 0; margin-bottom: 8px; }
    .subtext { font-size: 14px; color: #94A3B8; line-height: 1.6; margin-bottom: 24px; }
    .details-card { background: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
    .details-header { font-size: 12px; font-weight: 700; color: #14B8A6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(51, 65, 85, 0.4); font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #94A3B8; font-weight: 500; }
    .detail-value { color: #F1F5F9; font-weight: 600; text-align: right; }
    .ip-badge { font-family: monospace; background: #0F172A; padding: 2px 8px; border-radius: 6px; color: #38BDF8; border: 1px solid #0284C7; }
    .guide-section { background: linear-gradient(180deg, #131E35 0%, #0F172A 100%); border: 1px solid #1E293B; border-radius: 14px; padding: 24px; margin-bottom: 28px; }
    .guide-title { font-size: 15px; font-weight: 700; color: #FFFFFF; margin-top: 0; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .guide-desc { font-size: 12px; color: #94A3B8; margin-bottom: 18px; line-height: 1.5; }
    .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .feature-box { background: #0F172A; border: 1px solid #334155; border-radius: 10px; padding: 14px; }
    .feature-icon { font-size: 20px; margin-bottom: 6px; }
    .feature-name { font-size: 13px; font-weight: 700; color: #F1F5F9; margin-bottom: 4px; }
    .feature-text { font-size: 11px; color: #94A3B8; line-height: 1.4; margin: 0; }
    .cta-container { text-align: center; margin: 28px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #0D9488 0%, #06B6D4 100%); color: #042F2E !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background: #0B132B; padding: 20px 24px; border-top: 1px solid #1E293B; text-align: center; font-size: 11px; color: #64748B; line-height: 1.6; }
    .footer a { color: #14B8A6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="header">
      <div class="logo-container">
        <!-- JanSahayak AI Logo SVG -->
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
          <path d="M24 4L6 12V22C6 33.1 13.7 43.4 24 46C34.3 43.4 42 33.1 42 22V12L24 4Z" fill="#0B1730" stroke="#14B8A6" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M24 14V34M14 24H34" stroke="#2DD4BF" stroke-width="2" stroke-linecap="round"/>
          <circle cx="24" cy="24" r="5" fill="#14B8A6"/>
          <circle cx="14" cy="24" r="3" fill="#2DD4BF"/>
          <circle cx="34" cy="24" r="3" fill="#2DD4BF"/>
          <circle cx="24" cy="14" r="3" fill="#2DD4BF"/>
          <circle cx="24" cy="34" r="3" fill="#2DD4BF"/>
        </svg>
        <div style="text-align: left; display: inline-block;">
          <h1 class="brand-title">JanSahayak <span>AI</span></h1>
          <div class="brand-subtitle">Smart Grievance Redressal</div>
        </div>
      </div>
      <div class="badge">${headerTitle}</div>
    </div>

    <!-- Body Content -->
    <div class="content">
      <h2 class="greeting">Namaste, ${user.full_name || 'Citizen'}! 🙏</h2>
      <p class="subtext">
        ${isRegistration
          ? 'Your official citizen account has been successfully created on the JanSahayak AI National Redressal Platform. Below are your verified registration details and account activity log.'
          : 'A new session sign-in was just recorded on your JanSahayak AI account. If this was you, no further action is required.'}
      </p>

      <!-- User Account Details Block -->
      <div class="details-card">
        <div class="details-header">👤 User Authentication &amp; Profile Summary</div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">User Full Name:</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-weight: 700; text-align: right; font-size: 13px;">${user.full_name || 'Citizen User'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">Official Email:</td>
            <td style="padding: 8px 0; color: #38BDF8; font-weight: 600; text-align: right; font-size: 13px;">${user.email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">Date of Birth (DOB):</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-weight: 600; text-align: right; font-size: 13px;">${formattedDob}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">Sign-In IP Address:</td>
            <td style="padding: 8px 0; text-align: right; font-size: 13px;">
              <span class="ip-badge">${ipAddress}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94A3B8; font-size: 13px;">Activity Timestamp:</td>
            <td style="padding: 8px 0; color: #94A3B8; text-align: right; font-size: 12px;">${currentTime}</td>
          </tr>
        </table>
      </div>

      <!-- Visual Guide: How to Use & Core Functionalities Card -->
      <div class="guide-section">
        <h3 class="guide-title">
          <span>🗺️</span> Platform Guide &amp; Core Civic Functionalities
        </h3>
        <p class="guide-desc">
          JanSahayak AI bridges citizens directly with civic authorities with automated department routing and time-bound SLAs:
        </p>

        <!-- Core Functionality Visual Diagram / SVG Banner -->
        <div style="background: #0B132B; border: 1px solid #14B8A6; border-radius: 12px; padding: 16px; margin-bottom: 18px; text-align: center;">
          <svg width="100%" height="160" viewBox="0 0 540 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
            <rect width="540" height="160" rx="10" fill="#0A1128"/>
            
            <!-- Step 1 -->
            <rect x="15" y="20" width="115" height="120" rx="8" fill="#111C38" stroke="#1E293B"/>
            <circle cx="72" cy="50" r="18" fill="#14B8A6" fill-opacity="0.2"/>
            <text x="72" y="55" font-size="16" text-anchor="middle" fill="#2DD4BF">🤖</text>
            <text x="72" y="85" font-size="11" font-weight="bold" text-anchor="middle" fill="#FFFFFF">1. AI Chatbot</text>
            <text x="72" y="103" font-size="9" text-anchor="middle" fill="#94A3B8">Report in Hindi /</text>
            <text x="72" y="116" font-size="9" text-anchor="middle" fill="#94A3B8">English with 1-click</text>
            
            <!-- Connector 1 -->
            <path d="M132 80H148" stroke="#14B8A6" stroke-width="2" stroke-dasharray="3 3"/>
            
            <!-- Step 2 -->
            <rect x="150" y="20" width="115" height="120" rx="8" fill="#111C38" stroke="#1E293B"/>
            <circle cx="207" cy="50" r="18" fill="#38BDF8" fill-opacity="0.2"/>
            <text x="207" y="55" font-size="16" text-anchor="middle" fill="#38BDF8">🏛️</text>
            <text x="207" y="85" font-size="11" font-weight="bold" text-anchor="middle" fill="#FFFFFF">2. 12 Departments</text>
            <text x="207" y="103" font-size="9" text-anchor="middle" fill="#94A3B8">Auto-dispatched</text>
            <text x="207" y="116" font-size="9" text-anchor="middle" fill="#94A3B8">to MCD, PWD, DJB...</text>
            
            <!-- Connector 2 -->
            <path d="M267 80H283" stroke="#14B8A6" stroke-width="2" stroke-dasharray="3 3"/>
            
            <!-- Step 3 -->
            <rect x="285" y="20" width="115" height="120" rx="8" fill="#111C38" stroke="#1E293B"/>
            <circle cx="342" cy="50" r="18" fill="#F59E0B" fill-opacity="0.2"/>
            <text x="342" y="55" font-size="16" text-anchor="middle" fill="#F59E0B">📍</text>
            <text x="342" y="85" font-size="11" font-weight="bold" text-anchor="middle" fill="#FFFFFF">3. GPS &amp; Photo</text>
            <text x="342" y="103" font-size="9" text-anchor="middle" fill="#94A3B8">Pin accurate location</text>
            <text x="342" y="116" font-size="9" text-anchor="middle" fill="#94A3B8">&amp; photo evidence</text>
            
            <!-- Connector 3 -->
            <path d="M402 80H418" stroke="#14B8A6" stroke-width="2" stroke-dasharray="3 3"/>
            
            <!-- Step 4 -->
            <rect x="420" y="20" width="105" height="120" rx="8" fill="#111C38" stroke="#14B8A6" stroke-width="1.5"/>
            <circle cx="472" cy="50" r="18" fill="#10B981" fill-opacity="0.2"/>
            <text x="472" y="55" font-size="16" text-anchor="middle" fill="#10B981">⏱️</text>
            <text x="472" y="85" font-size="11" font-weight="bold" text-anchor="middle" fill="#2DD4BF">4. Unique ID</text>
            <text x="472" y="103" font-size="9" text-anchor="middle" fill="#FFFFFF">JS-2026-XXXXX</text>
            <text x="472" y="116" font-size="9" text-anchor="middle" fill="#94A3B8">Time-bound SLA</text>
          </svg>
        </div>

        <div style="display: table; width: 100%;">
          <div style="display: table-row;">
            <div style="display: table-cell; width: 50%; padding-right: 6px; padding-bottom: 10px;">
              <div style="background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
                <div style="font-weight: 700; color: #FFFFFF; font-size: 12px;">💬 Real-Time AI Chatbot</div>
                <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;">File complaints in plain Hindi or English via bottom-right floating chat.</div>
              </div>
            </div>
            <div style="display: table-cell; width: 50%; padding-left: 6px; padding-bottom: 10px;">
              <div style="background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
                <div style="font-weight: 700; color: #FFFFFF; font-size: 12px;">🏛️ 12 Gov Departments</div>
                <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;">Covers MCD, PWD, DJB, EPD, Police, Fire, Environment, Ration &amp; more.</div>
              </div>
            </div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; width: 50%; padding-right: 6px;">
              <div style="background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
                <div style="font-weight: 700; color: #FFFFFF; font-size: 12px;">📍 GPS &amp; Camera Proof</div>
                <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;">Street-level geotagging and photo evidence ensure verifiable resolution.</div>
              </div>
            </div>
            <div style="display: table-cell; width: 50%; padding-left: 6px;">
              <div style="background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
                <div style="font-weight: 700; color: #FFFFFF; font-size: 12px;">⏱️ Legal SLA Tracking</div>
                <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;">Unique tracking ID with automated algorithmic escalation to higher authorities.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="cta-container">
        <a href="${clientUrl}" class="cta-button">
          Open JanSahayak AI Portal →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong>JanSahayak AI • Smart Public Grievance Redressal Architecture</strong><br>
      Department of Administrative Reforms &amp; Public Grievances (DARPG Aligned Framework)<br>
      This is an automated system security dispatch. Please do not reply directly to this email.<br>
      <span style="color: #475569; font-size: 10px;">Protected by 256-bit TLS Encryption • National Smart Governance Initiative</span>
    </div>
  </div>
</body>
</html>
  `.trim();

  const plainText = `
JanSahayak AI - ${headerTitle}
==================================================
Namaste, ${user.full_name || 'Citizen'}!

User Details:
• Name: ${user.full_name || 'Citizen User'}
• Email: ${user.email}
• Date of Birth: ${formattedDob}
• Sign-In IP Address: ${ipAddress}
• Timestamp: ${currentTime}

Core Functionalities & How to Use JanSahayak AI:
1. Real-Time AI Chatbot: Submit civic complaints in Hindi or English with 1-click.
2. 12 Participating Departments: Automated routing to MCD, PWD, DJB, EPD, Police, Fire, etc.
3. GPS Geotagging & Photo Evidence: Pin exact incident coordinates with photo proof.
4. Unique Tracking ID (JS-2026-XXXXX): Time-bound legal resolution with auto-escalation.

Access Portal: ${clientUrl}
==================================================
Department of Administrative Reforms & Public Grievances
  `.trim();

  return { subject, html, plainText };
}

/**
 * Dispatches an authentication mailer on user login or registration
 */
export async function sendAuthMailer({ user, ipAddress, eventType = 'login' }) {
  if (!user || !user.email) return null;

  const normalizedIp = (ipAddress || '127.0.0.1').replace(/^::ffff:/, '');
  const { subject, html, plainText } = buildAuthEmailTemplate({
    user,
    ipAddress: normalizedIp,
    eventType
  });

  const mailRecord = {
    id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: user.id || null,
    to: user.email,
    recipient_name: user.full_name || 'Citizen',
    subject,
    event_type: eventType,
    ip_address: normalizedIp,
    html,
    text: plainText,
    sent_at: new Date().toISOString()
  };

  // Record in memory store
  mockSentEmails.unshift(mailRecord);

  // If Supabase notifications table exists, record notification
  if (isSupabaseConfigured && user.id) {
    try {
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: subject,
        message: `${eventType === 'registration' ? 'Welcome to JanSahayak AI.' : 'New login recorded'} from IP: ${normalizedIp}`,
        type: eventType,
        is_read: false
      }]);
    } catch {
      // Non-blocking notification backup
    }
  }

  // Console log security dispatch
  console.log(`=================================================`);
  console.log(`✉️ [JanSahayak Mailer] Email Dispatched Successfully`);
  console.log(`📥 To: ${user.email} (${user.full_name || 'Citizen'})`);
  console.log(`📌 Subject: ${subject}`);
  console.log(`🌐 Client IP: ${normalizedIp}`);
  console.log(`🎂 DOB: ${user.dob || 'Not specified'}`);
  console.log(`🏷️ Event: ${eventType.toUpperCase()}`);
  console.log(`=================================================`);

  return mailRecord;
}
