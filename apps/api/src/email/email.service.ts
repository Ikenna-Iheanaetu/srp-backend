import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private readonly frontendUrl: string;

  constructor(
    private readonly mailer: MailerService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl =
      process.env.EMAIL_URL || 'https://srs-front.mmsoft.com.br';
  }

  async sendAccountCreatedAndVeriifcationEmail(email: string, otp: string) {
    const html = this.loadAndReplace('account-verification.html', {
      email,
      otp,
    });
    await this.mailer.sendMail({
      to: email,
      subject: 'Account Created - Verify your email',
      html,
    });
  }

  async sendForgotPasswordEmail(email: string, name: string, otp: string) {
    const html = this.loadAndReplace('forgot-password.html', {
      name,
      otp,
    });
    await this.mailer.sendMail({
      to: email,
      subject: 'Forgot Password',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, otp: string) {
    const html = this.loadAndReplace('forgot-password.html', {
      otp,
    });
    await this.mailer.sendMail({
      to: email,
      subject: 'Password Reset',
      html,
    });
  }

  async sendPasswordResetConfirmationEmail(email: string) {
    const html = this.loadAndReplace('password-reset-confirmation.html', {});
    await this.mailer.sendMail({
      to: email,
      subject: 'Password Reset Confirmation',
      html,
    });
  }

  async sendCompanyInviteEmail(
    email: string,
    clubName: string,
    clubRefCode: string,
    otp: string,
  ) {
    const html = this.loadAndReplace('invite-company.html', {
      clubName,
      refCode: clubRefCode,
      otp,
      frontendUrl: this.frontendUrl,
    });
    await this.mailer.sendMail({
      to: email,
      subject: 'Company Affiliate Invite',
      html,
    });
  }

  async sendClubInviteEmail(email: string, refCode: string, otp: string) {
    const html = this.loadAndReplace('invite-club.html', {
      email,
      refCode,
      otp,
      frontendUrl: this.frontendUrl,
    });
    this.mailer.sendMail({
      to: email,
      subject: 'Club Affiliate Invite',
      html,
    });
  }

  async sendPlayerSupporterInviteEmail(
    email: string,
    userType: string,
    clubName: string,
    clubRefCode: string,
    otp: string,
  ) {
    const html = this.loadAndReplace('invite-player-supporter.html', {
      clubName,
      userRole: userType,
      refCode: clubRefCode,
      otp,
      frontendUrl: this.frontendUrl,
    });
    await this.mailer.sendMail({
      to: email,
      subject: `${userType.toLowerCase().charAt(0).toUpperCase() + userType.toLowerCase().slice(1)} Affiliate Invite`,
      html,
    });
  }

  async declineAffiliateInviteEmail(email: string) {
    const html = this.loadAndReplace('decline-affiliate-invite.html');
    this.mailer.sendMail({
      to: email,
      subject: 'Declined Affiliate Inivte',
      html,
    });
  }

  async clubUpdateEmail(email: string, message: string) {
    const html = this.loadAndReplace('club-update.html', {
      message,
    });
    this.mailer.sendMail({
      to: email,
      subject: 'New Club Update',
      html,
    });
  }

  async sendPlayerChatInquiryEmail(
    playerEmail: string,
    playerFirstName: string,
    companyName: string,
    companyEmail: string,
    chatId: string,
  ) {
    // Generate JWT token with 24-hour expiration
    const tokenPayload = {
      chatId,
      playerEmail,
      companyEmail,
      type: 'hire-confirmation',
    };

    const confirmationToken = this.jwtService.sign(tokenPayload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '24h',
    });

    // URL-encode company name for safe URL transmission
    const encodedCompanyName = encodeURIComponent(companyName);

    // Prepare template variables
    const html = this.loadAndReplace('player-chat-inquiry.html', {
      playerFirstName,
      companyName,
      playerEmail,
      companyEmail,
      encodedCompanyName,
      chatId,
      confirmationToken,
      frontendUrl: this.frontendUrl,
    });

    await this.mailer.sendMail({
      to: playerEmail,
      subject: `Follow-up: Chat with ${companyName}`,
      html,
    });
  }

  private loadAndReplace(
    fileName: string,
    variables: Record<string, string> = {},
  ): string {
    let html = readFileSync(
      join(__dirname, '..', '..', 'email', 'templates', fileName),
      'utf8',
    );
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    });
    return html;
  }
}
