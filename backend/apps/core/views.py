from rest_framework import viewsets

from apps.core.mixins import OwnedQuerysetMixin
from apps.core.models import Tag
from apps.core.serializers import TagSerializer


class TagViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet[Tag]):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
