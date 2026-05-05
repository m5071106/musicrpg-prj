from rest_framework import serializers
from .models import Feedback, LoginHistory


class FeedbackSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'username', 'content', 'created_at', 'jira_issue_key']
        read_only_fields = ['id', 'username', 'created_at', 'jira_issue_key']


class LoginHistorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = LoginHistory
        fields = ['id', 'username', 'logged_in_at']
