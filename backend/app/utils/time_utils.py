from datetime import datetime, date, timezone, timedelta

try:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    """Returns the current datetime in Indian Standard Time (IST, UTC+5:30)."""
    return datetime.now(IST)

def get_ist_today() -> date:
    """Returns today's date in Indian Standard Time (IST)."""
    return get_ist_now().date()

def get_ist_today_str() -> str:
    """Returns today's date formatted as YYYY-MM-DD in IST."""
    return get_ist_today().isoformat()

def get_ist_time_str() -> str:
    """Returns current time formatted as 'HH:MM AM/PM' in IST."""
    return get_ist_now().strftime("%I:%M %p")
