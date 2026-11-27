from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.planning.views import (
    CalendarEventViewSet,
    CalendarView,
    WeeklyPlanBlockViewSet,
    WeeklyPlanProfileViewSet,
)

router = DefaultRouter()
router.register("events", CalendarEventViewSet, basename="event")
router.register("week-profiles", WeeklyPlanProfileViewSet, basename="week-profile")
router.register("week-blocks", WeeklyPlanBlockViewSet, basename="week-block")

urlpatterns = [
    path("calendar/", CalendarView.as_view(), name="calendar"),
    *router.urls,
]
