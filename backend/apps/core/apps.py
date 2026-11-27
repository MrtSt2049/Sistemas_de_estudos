from django.apps import AppConfig
from django.db.models.signals import post_migrate

from apps.core.db_security import enable_row_level_security


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Core"

    def ready(self) -> None:
        # `sender=self` runs it once per `migrate`, after every migration is applied.
        post_migrate.connect(
            enable_row_level_security,
            sender=self,
            dispatch_uid="core.enable_row_level_security",
        )
