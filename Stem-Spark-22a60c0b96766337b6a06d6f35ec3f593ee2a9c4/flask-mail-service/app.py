from flask import Flask, request, jsonify
from flask_mail import Mail, Message
from flask_cors import CORS
import os
import json
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

# Email templates
EMAIL_TEMPLATES = {
    'tutoring_request': {
        'subject': 'New Tutoring Request - NOVAKINETIX ACADEMY',
        'html_template': '''
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563EB, #3B82F6); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">NOVAKINETIX ACADEMY</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px;">Empowering Future Innovators</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
                <h2 style="color: #2563EB; margin-bottom: 20px;">New Tutoring Request</h2>
                <p>Hello {intern_name},</p>
                <p>A student has submitted a new tutoring request that matches your expertise.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2563EB; margin-top: 0;">Request Details:</h3>
                    <p><strong>Subject:</strong> {subject}</p>
                    <p><strong>Student:</strong> {student_name}</p>
                    <p><strong>Description:</strong> {description}</p>
                    <p><strong>Learning Goals:</strong> {learning_goals}</p>
                    <p><strong>Preferred Time:</strong> {preferred_time}</p>
                    <p><strong>Duration:</strong> {duration} minutes</p>
                </div>
                <p>Please log in to your intern dashboard to review and accept this request.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{dashboard_url}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
                </div>
                <p>Thank you for your dedication to student success!</p>
                <p>Best regards,<br>The NOVAKINETIX ACADEMY Team</p>
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>This email was sent from NOVAKINETIX ACADEMY. Please do not reply to this email.</p>
            </div>
        </div>
        '''
    },
    'tutoring_accepted': {
        'subject': 'Tutoring Request Accepted - NOVAKINETIX ACADEMY',
        'html_template': '''
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563EB, #3B82F6); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">NOVAKINETIX ACADEMY</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px;">Empowering Future Innovators</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
                <h2 style="color: #2563EB; margin-bottom: 20px;">Tutoring Request Accepted!</h2>
                <p>Hello {student_name},</p>
                <p>Great news! Your tutoring request has been accepted by an intern.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2563EB; margin-top: 0;">Session Details:</h3>
                    <p><strong>Subject:</strong> {subject}</p>
                    <p><strong>Intern:</strong> {intern_name}</p>
                    <p><strong>Scheduled Time:</strong> {scheduled_time}</p>
                    <p><strong>Duration:</strong> {duration} minutes</p>
                </div>
                <p>Please prepare for your session and be ready to discuss your learning goals.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{dashboard_url}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Session Details</a>
                </div>
                <p>We're excited to help you achieve your learning goals!</p>
                <p>Best regards,<br>The NOVAKINETIX ACADEMY Team</p>
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>This email was sent from NOVAKINETIX ACADEMY. Please do not reply to this email.</p>
            </div>
        </div>
        '''
    },
    'volunteer_reminder': {
        'subject': 'Upcoming Volunteer Opportunity - NOVAKINETIX ACADEMY',
        'html_template': '''
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563EB, #3B82F6); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">NOVAKINETIX ACADEMY</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px;">Empowering Future Innovators</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
                <h2 style="color: #2563EB; margin-bottom: 20px;">Volunteer Opportunity Reminder</h2>
                <p>Hello {intern_name},</p>
                <p>This is a friendly reminder about your upcoming volunteer opportunity.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2563EB; margin-top: 0;">Event Details:</h3>
                    <p><strong>Event:</strong> {event_title}</p>
                    <p><strong>Date:</strong> {event_date}</p>
                    <p><strong>Location:</strong> {event_location}</p>
                    <p><strong>Description:</strong> {event_description}</p>
                </div>
                <p>Please arrive on time and bring any necessary materials.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{dashboard_url}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
                </div>
                <p>Thank you for your commitment to our community!</p>
                <p>Best regards,<br>The NOVAKINETIX ACADEMY Team</p>
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>This email was sent from NOVAKINETIX ACADEMY. Please do not reply to this email.</p>
            </div>
        </div>
        '''
    },
    'parent_progress': {
        'subject': 'Student Progress Update - NOVAKINETIX ACADEMY',
        'html_template': '''
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563EB, #3B82F6); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">NOVAKINETIX ACADEMY</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px;">Empowering Future Innovators</p>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
                <h2 style="color: #2563EB; margin-bottom: 20px;">Progress Update</h2>
                <p>Hello {parent_name},</p>
                <p>Here's an update on {student_name}'s progress at NOVAKINETIX ACADEMY.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2563EB; margin-top: 0;">Recent Activity:</h3>
                    <p><strong>Completed Lessons:</strong> {completed_lessons}</p>
                    <p><strong>Average Score:</strong> {average_score}%</p>
                    <p><strong>Time Spent:</strong> {time_spent} minutes</p>
                    <p><strong>Recent Achievements:</strong> {achievements}</p>
                </div>
                <p>Keep up the great work! Your child is making excellent progress.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{dashboard_url}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Full Progress</a>
                </div>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br>The NOVAKINETIX ACADEMY Team</p>
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>This email was sent from NOVAKINETIX ACADEMY. Please do not reply to this email.</p>
            </div>
        </div>
        '''
    }
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'flask-mail-service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/send-email', methods=['POST'])
def send_email():
    """Send email using templates"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email_type = data.get('type')
        recipient_email = data.get('to')
        template_data = data.get('data', {})
        
        if not email_type or not recipient_email:
            return jsonify({'error': 'Missing required fields: type, to'}), 400
        
        if email_type not in EMAIL_TEMPLATES:
            return jsonify({'error': f'Unknown email type: {email_type}'}), 400
        
        template = EMAIL_TEMPLATES[email_type]
        subject = template['subject']
        html_content = template['html_template'].format(**template_data)
        
        # Create message
        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            html=html_content
        )
        
        # Send email
        mail.send(msg)
        
        logger.info(f"Email sent successfully to {recipient_email} (type: {email_type})")
        
        return jsonify({
            'success': True,
            'message': 'Email sent successfully',
            'recipient': recipient_email,
            'type': email_type
        })
        
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return jsonify({
            'error': 'Failed to send email',
            'details': str(e)
        }), 500

@app.route('/send-custom-email', methods=['POST'])
def send_custom_email():
    """Send custom email with provided content"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        recipient_email = data.get('to')
        subject = data.get('subject')
        html_content = data.get('html_content')
        text_content = data.get('text_content')
        
        if not recipient_email or not subject:
            return jsonify({'error': 'Missing required fields: to, subject'}), 400
        
        # Create message
        msg = Message(
            subject=subject,
            recipients=[recipient_email]
        )
        
        if html_content:
            msg.html = html_content
        if text_content:
            msg.body = text_content
        
        # Send email
        mail.send(msg)
        
        logger.info(f"Custom email sent successfully to {recipient_email}")
        
        return jsonify({
            'success': True,
            'message': 'Custom email sent successfully',
            'recipient': recipient_email
        })
        
    except Exception as e:
        logger.error(f"Error sending custom email: {str(e)}")
        return jsonify({
            'error': 'Failed to send custom email',
            'details': str(e)
        }), 500

@app.route('/templates', methods=['GET'])
def get_templates():
    """Get available email templates"""
    return jsonify({
        'templates': list(EMAIL_TEMPLATES.keys()),
        'template_details': {
            name: {'subject': template['subject']} 
            for name, template in EMAIL_TEMPLATES.items()
        }
    })

# For Vercel deployment
app.debug = False

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Flask Mail Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug) 