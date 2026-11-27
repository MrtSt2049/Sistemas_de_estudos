"""Root URL configuration for Study Platform."""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.core.health import healthz, readyz

urlpatterns = [
    path("healthz", healthz, name="healthz"),
    path("readyz", readyz, name="readyz"),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.core.urls")),
    path("api/v1/", include("apps.cp.urls")),
    path("api/v1/", include("apps.reviews.urls")),
    path("api/v1/", include("apps.studysessions.urls")),
    path("api/v1/", include("apps.exercises.urls")),
    path("api/v1/", include("apps.disciplines.urls")),
    path("api/v1/", include("apps.curriculum.urls")),
]

if getattr(settings, "ENABLE_API_DOCS", False):
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(url_name="api-schema"),
            name="api-docs",
        ),
    ]
