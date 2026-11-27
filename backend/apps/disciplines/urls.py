from rest_framework.routers import DefaultRouter

from apps.disciplines.views import DisciplineViewSet

router = DefaultRouter()
router.register("disciplines", DisciplineViewSet, basename="discipline")

urlpatterns = router.urls
