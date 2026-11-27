from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.goals.views import GoalViewSet, PeriodicReviewViewSet, ReviewDraftView

router = DefaultRouter()
router.register("goals", GoalViewSet, basename="goal")
router.register("periodic-reviews", PeriodicReviewViewSet, basename="periodic-review")

urlpatterns = [
    # Antes do router, para "draft" não ser lido como um id.
    path("periodic-reviews/draft/", ReviewDraftView.as_view(), name="periodic-review-draft"),
    *router.urls,
]
