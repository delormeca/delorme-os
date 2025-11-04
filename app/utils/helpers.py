import datetime


def get_utcnow():
    """
    Returns the current datetime in UTC.
    """
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
