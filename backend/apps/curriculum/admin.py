from django.contrib import admin

from apps.curriculum.models import Topic


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ["title", "discipline", "status", "owner"]
    list_filter = ["status"]
    search_fields = ["title", "owner__email"]
