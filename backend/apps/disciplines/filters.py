import django_filters

from apps.disciplines.models import Discipline, DisciplineKind


class DisciplineFilter(django_filters.FilterSet):
    kind = django_filters.ChoiceFilter(choices=DisciplineKind.choices)

    class Meta:
        model = Discipline
        fields = ["kind"]
