from django.urls import path

from apps.exports.views import IcsExportView, JsonExportView, MarkdownExportView

urlpatterns = [
    path("export/json/", JsonExportView.as_view(), name="export-json"),
    path("export/markdown/", MarkdownExportView.as_view(), name="export-markdown"),
    path("export/ics/", IcsExportView.as_view(), name="export-ics"),
]
