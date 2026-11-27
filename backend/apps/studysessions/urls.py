from rest_framework.routers import DefaultRouter

from apps.studysessions.views import StudySessionViewSet

router = DefaultRouter()
router.register("study-sessions", StudySessionViewSet, basename="study-session")

urlpatterns = router.urls
