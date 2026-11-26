from rest_framework.routers import DefaultRouter

from apps.core.views import TagViewSet

router = DefaultRouter()
router.register("tags", TagViewSet, basename="tag")

urlpatterns = router.urls
