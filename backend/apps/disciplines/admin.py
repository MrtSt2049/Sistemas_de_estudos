from django.contrib import admin

from apps.disciplines.models import Discipline


@admin.register(Discipline)
class DisciplineAdmin(admin.ModelAdmin):
    list_display = ["name", "kind", "owner", "position", "archived_at"]
    list_filter = ["kind"]
    search_fields = ["name", "code", "owner__email"]
