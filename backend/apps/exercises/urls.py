from rest_framework.routers import DefaultRouter

from apps.exercises.views import (
    AttemptViewSet,
    ErrorTypeViewSet,
    ExerciseSourceViewSet,
    ExerciseViewSet,
)

router = DefaultRouter()
router.register("exercise-sources", ExerciseSourceViewSet, basename="exercise-source")
router.register("error-types", ErrorTypeViewSet, basename="error-type")
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("attempts", AttemptViewSet, basename="attempt")

urlpatterns = router.urls
