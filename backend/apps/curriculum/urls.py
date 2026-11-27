from rest_framework.routers import DefaultRouter

from apps.curriculum.views import TopicViewSet

router = DefaultRouter()
router.register("topics", TopicViewSet, basename="topic")

urlpatterns = router.urls
