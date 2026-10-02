import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Union

from app.core.config import settings

logger = logging.getLogger("app.email")


def send_live_email(
    recipients: Union[str, List[str]],
    subject: str,
    body: str,
    html_body: str = None,
) -> bool:
    """
    Sends a live email via SMTP using configured Gmail/SMTP credentials.
    Returns True if successfully sent, False otherwise.
    """
    if not getattr(settings, "SMTP_ENABLED", False):
        logger.info(f"[Email Sim] SMTP not enabled. Email to {recipients} logged only.")
        return True

    if isinstance(recipients, str):
        recipients = [r.strip() for r in recipients.split(",") if r.strip()]

    if not recipients:
        return False

    sender_email = getattr(settings, "SMTP_FROM_EMAIL", "tdevendiran123@gmail.com")
    sender_name = getattr(settings, "SMTP_FROM_NAME", "ToolShoppe Industrial Supply")
    smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(getattr(settings, "SMTP_PORT", 587))
    smtp_user = getattr(settings, "SMTP_USER", sender_email)
    smtp_pass = getattr(settings, "SMTP_PASSWORD", "")

    if not smtp_pass:
        logger.warning("[Email] SMTP password not set. Skipping live delivery.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject

        # Plain text version
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # HTML version if provided
        if html_body:
            msg.attach(MIMEText(html_body, "html", "utf-8"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(sender_email, recipients, msg.as_string())
        server.quit()
        logger.info(f"[Email Success] Sent live email to {recipients}: '{subject}'")
        return True
    except Exception as exc:
        logger.error(f"[Email Error] Failed to send email to {recipients}: {exc}")
        return False


def fetch_inbox_messages(limit: int = 15) -> List[dict]:
    """
    Connects to IMAP (Gmail) and retrieves recent incoming emails (e.g. supplier replies).
    """
    import imaplib
    import email
    from email.header import decode_header

    smtp_user = getattr(settings, "SMTP_USER", "tdevendiran123@gmail.com")
    smtp_pass = getattr(settings, "SMTP_PASSWORD", "")
    if not smtp_pass:
        return []

    results = []
    mail = None
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993, timeout=8)
        mail.login(smtp_user, smtp_pass)
        status, count_data = mail.select("inbox")
        total = int(count_data[0]) if count_data and count_data[0] else 0
        if total == 0:
            return []

        start = max(1, total - limit + 1)
        res, data = mail.fetch(f"{start}:{total}", "(RFC822)")

        for item in reversed(data):
            if isinstance(item, tuple) and len(item) > 1:
                try:
                    msg = email.message_from_bytes(item[1])
                    sub_raw = decode_header(msg.get("Subject", ""))[0]
                    subject = sub_raw[0].decode(sub_raw[1] or "utf-8", errors="ignore") if isinstance(sub_raw[0], bytes) else str(sub_raw[0] or "")
                    
                    sender = msg.get("From", "")
                    date_str = msg.get("Date", "")
                    
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                payload = part.get_payload(decode=True)
                                if payload:
                                    body = payload.decode("utf-8", errors="ignore")
                                    break
                    else:
                        payload = msg.get_payload(decode=True)
                        if payload:
                            body = payload.decode("utf-8", errors="ignore")

                    results.append({
                        "id": str(len(results) + 1),
                        "sender": sender,
                        "subject": subject,
                        "date": date_str,
                        "body": body.strip(),
                        "preview": body.strip()[:180].replace("\n", " "),
                    })
                except Exception as e:
                    logger.debug(f"Error parsing email item: {e}")
                    continue
    except Exception as exc:
        logger.error(f"[IMAP Error] Failed to fetch inbox messages: {exc}")
    finally:
        if mail:
            try:
                mail.close()
                mail.logout()
            except Exception:
                pass

    return results

