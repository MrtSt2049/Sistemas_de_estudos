"""Custom User (email login, UUID PK) and UserProfile models (RF088–RF093, ADR-04/05)."""

import uuid
from typing import Any, ClassVar

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from apps.core.models import TimeStampedModel


class ThemeChoice(models.TextChoices):
    LIGHT = "light", "Claro"
    DARK = "dark", "Escuro"
    SYSTEM = "system", "Sistema"


def default_review_intervals() -> list[int]:
    return [3, 7, 21]  # D-04: D+3, D+7, D+21


class UserManager(BaseUserManager["User"]):
    def create_user(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> "User":
        if not email:
            raise ValueError("O endereço de e-mail é obrigatório.")
        normalized = self.normalize_email(email).lower()
        user = self.model(email=normalized, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusuário deve ter is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusuário deve ter is_superuser=True.")

        user = self.create_user(email=email, password=password, **extra_fields)
        UserProfile.objects.get_or_create(user=user)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=254)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.email


class UserProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=120, blank=True, default="")
    timezone = models.CharField(max_length=64, default="America/Sao_Paulo")
    locale = models.CharField(max_length=16, default="pt-BR")
    theme = models.CharField(
        max_length=16,
        choices=ThemeChoice.choices,
        default=ThemeChoice.SYSTEM,
    )
    daily_study_goal_minutes = models.PositiveSmallIntegerField(default=120)
    week_starts_on = models.PositiveSmallIntegerField(default=0)
    review_intervals_days = models.JSONField(default=default_review_intervals)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    daily_study_goal_minutes__gte=10, daily_study_goal_minutes__lte=960
                ),
                name="ck_accounts_profile_daily_goal_range",
            ),
            models.CheckConstraint(
                condition=models.Q(week_starts_on__gte=0, week_starts_on__lte=6),
                name="ck_accounts_profile_week_starts_on_range",
            ),
        ]

    def __str__(self) -> str:
        return self.display_name or self.user.email
