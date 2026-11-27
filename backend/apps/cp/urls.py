from django.urls import path

from apps.cp.views import SummaryView, SyncView, UpsolvingImportView, UpsolvingView

urlpatterns = [
    path("cp/sync/", SyncView.as_view(), name="cp-sync"),
    path("cp/summary/", SummaryView.as_view(), name="cp-summary"),
    path("cp/upsolving/", UpsolvingView.as_view(), name="cp-upsolving"),
    path("cp/upsolving/import/", UpsolvingImportView.as_view(), name="cp-upsolving-import"),
]
