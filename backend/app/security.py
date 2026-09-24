import html
import ipaddress
import re

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from .config import settings


def _is_trusted_proxy(host: str | None) -> bool:
    """Forwarding headers are only honored from loopback/private (docker) remotes."""
    if not host or host == "testclient":
        return True
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False
    return ip.is_loopback or ip.is_private


def client_ip_key(request: Request) -> str:
    remote = get_remote_address(request)
    if not _is_trusted_proxy(remote):
        return remote
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return remote


limiter = Limiter(
    key_func=client_ip_key,
    storage_uri=settings.rate_limit_storage,
    headers_enabled=True,
)


def sanitize_html(text: str) -> str:
    return html.escape(text, quote=True)


CASE_NAME_PATTERN = re.compile(r"^[\w\s\-.,:;()%/+°ºáéíóúÁÉÍÓÚñÑ]{1,100}$")


def validate_case_name(name: str) -> bool:
    return bool(CASE_NAME_PATTERN.match(name))


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": ("default-src 'none'; frame-ancestors 'none'; base-uri 'none'"),
}


def add_security_headers(response):
    for h, v in SECURITY_HEADERS.items():
        response.headers[h] = v
    return response
