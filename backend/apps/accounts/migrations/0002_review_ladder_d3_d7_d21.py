"""D-04: the default review ladder becomes D+3, D+7, D+21.

Only profiles still holding the previous default are updated, so a customised
ladder is preserved.
"""

from django.db import migrations

OLD_DEFAULT = [1, 3, 10, 30]
NEW_DEFAULT = [3, 7, 21]


def apply_new_default(apps, schema_editor):
    profile = apps.get_model("accounts", "UserProfile")
    profile.objects.filter(review_intervals_days=OLD_DEFAULT).update(
        review_intervals_days=NEW_DEFAULT
    )


def restore_old_default(apps, schema_editor):
    profile = apps.get_model("accounts", "UserProfile")
    profile.objects.filter(review_intervals_days=NEW_DEFAULT).update(
        review_intervals_days=OLD_DEFAULT
    )


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [migrations.RunPython(apply_new_default, restore_old_default)]
