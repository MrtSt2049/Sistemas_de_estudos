from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.reviews"
    verbose_name = "Revisões"

    def ready(self) -> None:
        from apps.exercises.services import attempt_recorded_hooks
        from apps.reviews.services import schedule_from_attempt

        # Roda dentro da transação que registra a tentativa (sem signals ocultos).
        if schedule_from_attempt not in attempt_recorded_hooks:
            attempt_recorded_hooks.append(schedule_from_attempt)
