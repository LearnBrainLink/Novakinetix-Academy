// Email service integration with Flask Mail microservice

const FLASK_MAIL_SERVICE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailData {
  type: string;
  to: string;
  data: Record<string, any>;
}

export interface CustomEmailData {
  to: string;
  subject: string;
  html_content?: string;
  text_content?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  recipient?: string;
  type?: string;
  error?: string;
  details?: string;
}

class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = FLASK_MAIL_SERVICE_URL;
  }

  private async makeRequest(endpoint: string, data: any): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/email${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendTemplatedEmail(emailData: EmailData): Promise<EmailResponse> {
    return this.makeRequest('/send-email', emailData);
  }

  async sendCustomEmail(emailData: CustomEmailData): Promise<EmailResponse> {
    return this.makeRequest('/send-custom-email', emailData);
  }

  async getTemplates(): Promise<{ templates: string[]; template_details: Record<string, any> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/email/templates`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return { templates: [], template_details: {} };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/email/health`);
      return response.ok;
    } catch (error) {
      console.error('Email service health check failed:', error);
      return false;
    }
  }

  // Convenience methods for specific email types
  async sendTutoringRequestNotification(
    internEmail: string,
    internName: string,
    studentName: string,
    subject: string,
    description: string,
    learningGoals: string,
    preferredTime: string,
    duration: number
  ): Promise<EmailResponse> {
    return this.sendTemplatedEmail({
      type: 'tutoring_request',
      to: internEmail,
      data: {
        intern_name: internName,
        student_name: studentName,
        subject,
        description,
        learning_goals: learningGoals,
        preferred_time: preferredTime,
        duration,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/intern-dashboard`
      }
    });
  }

  async sendTutoringAcceptedNotification(
    studentEmail: string,
    studentName: string,
    internName: string,
    subject: string,
    scheduledTime: string,
    duration: number
  ): Promise<EmailResponse> {
    return this.sendTemplatedEmail({
      type: 'tutoring_accepted',
      to: studentEmail,
      data: {
        student_name: studentName,
        intern_name: internName,
        subject,
        scheduled_time: scheduledTime,
        duration,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/student-dashboard`
      }
    });
  }

  async sendVolunteerReminder(
    internEmail: string,
    internName: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
    eventDescription: string
  ): Promise<EmailResponse> {
    return this.sendTemplatedEmail({
      type: 'volunteer_reminder',
      to: internEmail,
      data: {
        intern_name: internName,
        event_title: eventTitle,
        event_date: eventDate,
        event_location: eventLocation,
        event_description: eventDescription,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/intern-dashboard`
      }
    });
  }

  async sendParentProgressUpdate(
    parentEmail: string,
    parentName: string,
    studentName: string,
    completedLessons: number,
    averageScore: number,
    timeSpent: number,
    achievements: string
  ): Promise<EmailResponse> {
    return this.sendTemplatedEmail({
      type: 'parent_progress',
      to: parentEmail,
      data: {
        parent_name: parentName,
        student_name: studentName,
        completed_lessons: completedLessons,
        average_score: averageScore,
        time_spent: timeSpent,
        achievements,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent-dashboard`
      }
    });
  }

  // Utility method to send notification emails
  async sendNotification(
    recipientEmail: string,
    subject: string,
    message: string,
    actionUrl?: string
  ): Promise<EmailResponse> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563EB, #3B82F6); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">NOVAKINETIX ACADEMY</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">Empowering Future Innovators</p>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2563EB; margin-bottom: 20px;">${subject}</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            ${message}
          </div>
          ${actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
            </div>
          ` : ''}
          <p>Best regards,<br>The NOVAKINETIX ACADEMY Team</p>
        </div>
        <div style="background: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This email was sent from NOVAKINETIX ACADEMY. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    return this.sendCustomEmail({
      to: recipientEmail,
      subject: `${subject} - NOVAKINETIX ACADEMY`,
      html_content: htmlContent
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
