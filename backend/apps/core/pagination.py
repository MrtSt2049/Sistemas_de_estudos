"""Standard pagination for list endpoints (DEVELOPMENT_PLAN §3.4.3)."""

from rest_framework.pagination import PageNumberPagination


class StandardPageNumberPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
