import mailchimp_transactional as MailchimpTransactional
from fastapi import HTTPException, status
from mailchimp_transactional.api_client import ApiClientError

from app.config import DOMAIN, FROM_EMAIL, FROM_NAME, MAILCHIMP_API_KEY


async def send_download_link_email(
    to_email: str,
    download_link: str,
):
    """Send download link email to user"""
    if not MAILCHIMP_API_KEY:
        # Skip email sending if not configured
        return True
        
    client = MailchimpTransactional.Client(MAILCHIMP_API_KEY)

    template_content = [
        {"name": "downloadlink", "content": download_link},
    ]

    message = {
        "from_email": FROM_EMAIL,
        "from_name": FROM_NAME,
        "to": [{"email": to_email}],
        "subject": "Download your Product",
        "merge_vars": [{"rcpt": to_email, "vars": template_content}],
    }

    try:
        client.messages.send_template(
            {
                "template_name": "download-product-email",
                "template_content": template_content,
                "message": message,
            }
        )
        return True
    except ApiClientError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send download email.",
        )


async def send_password_reset_email(
    to_email: str,
    full_name: str,
    reset_token: str,
):
    """Send password reset email with reset link"""
    if not MAILCHIMP_API_KEY:
        # Skip email sending if not configured
        return True
        
    client = MailchimpTransactional.Client(MAILCHIMP_API_KEY)

    # Create reset link
    reset_link = f"{DOMAIN}/reset-password?token={reset_token}"

    template_content = [
        {"name": "name", "content": full_name},
        {"name": "reset_link", "content": reset_link},
    ]

    message = {
        "from_email": FROM_EMAIL,
        "from_name": FROM_NAME,
        "to": [{"email": to_email, "name": full_name}],
        "subject": "Reset Your Password",
        "merge_vars": [{"rcpt": to_email, "vars": template_content}],
    }

    try:
        client.messages.send_template(
            {
                "template_name": "password-reset-email",
                "template_content": template_content,
                "message": message,
            }
        )
        return True
    except ApiClientError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email.",
        )
