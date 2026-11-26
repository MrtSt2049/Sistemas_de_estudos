"""Account domain services (user creation, password change, token revocation)."""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from apps.accounts.models import User, UserProfile
from apps.core.exceptions import ConflictError, RuleViolationError


@transaction.atomic
def create_user_with_profile(*, email: str, password: str, display_name: str = "") -> User:
    normalized = email.strip().lower()
    if User.objects.filter(email=normalized).exists():
        raise ConflictError("Já existe um usuário com este e-mail.", code="email_already_exists")

    try:
        validate_password(password)
    except DjangoValidationError as exc:
        raise RuleViolationError(
            "A senha não atende aos requisitos mínimos de segurança.",
            code="weak_password",
            details={"password": list(exc.messages)},
        ) from exc

    user = User.objects.create_user(email=normalized, password=password)
    UserProfile.objects.create(user=user, display_name=display_name.strip())
    return user


@transaction.atomic
def change_user_password(*, user: User, current_password: str, new_password: str) -> None:
    if not user.check_password(current_password):
        raise RuleViolationError(
            "Senha atual incorreta.",
            code="invalid_current_password",
            details={"current_password": ["Senha atual incorreta."]},
        )

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as exc:
        raise RuleViolationError(
            "A nova senha não atende aos requisitos mínimos de segurança.",
            code="weak_password",
            details={"new_password": list(exc.messages)},
        ) from exc

    user.set_password(new_password)
    user.save(update_fields=["password"])

    # Invalidate all active refresh tokens (RF090, RNF002)
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)
