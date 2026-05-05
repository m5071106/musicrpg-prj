from django.urls import path
from .views import (
    FeedbackCreateView,
    AdminFeedbackListView,
    AdminLoginHistoryListView,
    AdminMeView,
    CreateJiraIssuesView,
    AdminUserListView,
    AdminUserPasswordResetView,
)

urlpatterns = [
    path('feedback/', FeedbackCreateView.as_view(), name='feedback-create'),
    path('admin/feedback/', AdminFeedbackListView.as_view(), name='admin-feedback'),
    path('admin/login-history/', AdminLoginHistoryListView.as_view(), name='admin-login-history'),
    path('admin/me/', AdminMeView.as_view(), name='admin-me'),
    path('admin/jira/', CreateJiraIssuesView.as_view(), name='admin-jira'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/reset-password/', AdminUserPasswordResetView.as_view(), name='admin-user-reset-password'),
]
