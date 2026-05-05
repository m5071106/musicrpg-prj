from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver


@receiver(user_logged_in)
def record_login(sender, user, request, **kwargs):
    from .models import LoginHistory
    LoginHistory.objects.create(user=user)
