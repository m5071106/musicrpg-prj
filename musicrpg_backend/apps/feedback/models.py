from django.conf import settings
from django.db import models


class Feedback(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='feedbacks'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    jira_issue_key = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        ordering = ['-created_at']


class LoginHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='login_histories'
    )
    logged_in_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-logged_in_at']
