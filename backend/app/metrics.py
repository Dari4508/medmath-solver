from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=(0.005, 0.025, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)

RATE_LIMIT_HITS = Counter(
    "rate_limit_hits_total",
    "Requests rejected by rate limiter",
)
