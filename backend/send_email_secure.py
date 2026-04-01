import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# 1. Load the .env file locally
# This command reads your local .env file and loads the variables into the system environment
load_dotenv()

def send_email_secure(recipient_email, subject, body):
    # 2. Fetch the credentials dynamically (never hardcoded)
    sender_email = os.environ.get("MAIL_USERNAME")
    sender_password = os.environ.get("MAIL_PASSWORD")
    smtp_server = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("MAIL_PORT", 587))

    if not sender_email or not sender_password:
        raise ValueError("SMTP credentials not found in environment variables. Check your .env file.")

    # 3. Construct the email
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = recipient_email

    try:
        # 4. Connect securely and send
        # Using STARTTLS on port 587 is a common standard, though port 465 with SMTP_SSL is also used.
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls() # Secure the connection
            server.login(sender_email, sender_password)
            server.send_message(msg)
        print("Email sent securely and successfully!")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

# Example usage (uncomment to test):
# if __name__ == "__main__":
#     send_email_secure("test@example.com", "Secure Test", "This email was sent using environment variables!")
