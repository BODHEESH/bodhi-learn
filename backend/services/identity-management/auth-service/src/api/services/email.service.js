// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\services\email.service.js

const nodemailer = require('nodemailer');
const config = require('../config/app.config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  async sendPasswordReset(email, resetToken) {
    const resetLink = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Reset Your Password - Bodhi Learn',
      html: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>Bodhi Learn Team</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendMFAEnabled(email) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Two-Factor Authentication Enabled - Bodhi Learn',
      html: `
        <h2>Two-Factor Authentication Enabled</h2>
        <p>Two-factor authentication has been successfully enabled for your account.</p>
        <p>From now on, you will need to enter a verification code when signing in.</p>
        <p>If you did not enable two-factor authentication, please contact support immediately.</p>
        <p>Best regards,<br>Bodhi Learn Team</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending MFA enabled email:', error);
      throw error;
    }
  }

  async sendMFADisabled(email) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Two-Factor Authentication Disabled - Bodhi Learn',
      html: `
        <h2>Two-Factor Authentication Disabled</h2>
        <p>Two-factor authentication has been disabled for your account.</p>
        <p>If you did not disable two-factor authentication, please contact support immediately.</p>
        <p>Best regards,<br>Bodhi Learn Team</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending MFA disabled email:', error);
      throw error;
    }
  }

  async sendPasswordChanged(email) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Password Changed - Bodhi Learn',
      html: `
        <h2>Password Changed</h2>
        <p>The password for your Bodhi Learn account has been changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <p>Best regards,<br>Bodhi Learn Team</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending password changed email:', error);
      throw error;
    }
  }

  async sendLoginAlert(email, loginDetails) {
    const { location, device, browser, ip } = loginDetails;
    
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'New Login Detected - Bodhi Learn',
      html: `
        <h2>New Login Detected</h2>
        <p>A new login was detected for your Bodhi Learn account.</p>
        <h3>Login Details:</h3>
        <ul>
          <li>Location: ${location}</li>
          <li>Device: ${device}</li>
          <li>Browser: ${browser}</li>
          <li>IP Address: ${ip}</li>
          <li>Time: ${new Date().toUTCString()}</li>
        </ul>
        <p>If this wasn't you, please change your password immediately and contact support.</p>
        <p>Best regards,<br>Bodhi Learn Team</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending login alert email:', error);
      throw error;
    }
  }
}

module.exports = { EmailService };
