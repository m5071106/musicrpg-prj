import base64
import re
import secrets
import string

import requests as http_requests
from django.contrib.auth import get_user_model
from django.conf import settings as django_settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Feedback, LoginHistory
from .serializers import FeedbackSerializer, LoginHistorySerializer


def _to_single_line(text: str) -> str:
    """改行・制御文字をスペースに置換して1行テキストにする。"""
    return re.sub(r'[\r\n\t]+', ' ', text).strip()


def _to_adf_inline(text: str) -> list:
    """テキストを ADF インラインノードのリストに変換する。改行は hardBreak に置換。"""
    nodes: list = []
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line:
            nodes.append({'type': 'text', 'text': line})
        if i < len(lines) - 1:
            nodes.append({'type': 'hardBreak'})
    return nodes or [{'type': 'text', 'text': text}]


class FeedbackCreateView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminFeedbackListView(generics.ListAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Feedback.objects.select_related('user').all()


class AdminLoginHistoryListView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = LoginHistory.objects.select_related('user').all()


class AdminMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'username': request.user.username,
            'is_staff': request.user.is_staff,
        })


class CreateJiraIssuesView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': '送信するコメントを選択してください'}, status=status.HTTP_400_BAD_REQUEST)

        base_url = django_settings.JIRA_BASE_URL
        email = django_settings.JIRA_EMAIL
        api_token = django_settings.JIRA_API_TOKEN
        project_key = django_settings.JIRA_PROJECT_KEY
        issue_type = django_settings.JIRA_ISSUE_TYPE

        if not all([base_url, email, api_token, project_key]):
            return Response(
                {'error': 'Jira の設定が不完全です。環境変数を確認してください'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        credentials = base64.b64encode(f'{email}:{api_token}'.encode()).decode()
        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        endpoint = f'{base_url.rstrip("/")}/rest/api/3/issue'

        feedbacks = Feedback.objects.filter(id__in=ids, jira_issue_key='')
        results = []

        for fb in feedbacks:
            summary = _to_single_line(fb.content)[:80] + ('...' if len(_to_single_line(fb.content)) > 80 else '')
            payload = {
                'fields': {
                    'project': {'key': project_key},
                    'summary': summary,
                    'description': {
                        'type': 'doc',
                        'version': 1,
                        'content': [
                            {
                                'type': 'paragraph',
                                'content': _to_adf_inline(fb.content),
                            },
                            {
                                'type': 'paragraph',
                                'content': [
                                    {
                                        'type': 'text',
                                        'text': f'投稿者: @{fb.user.username}　日時: {fb.created_at.strftime("%Y-%m-%d %H:%M")}',
                                        'marks': [{'type': 'em'}],
                                    }
                                ],
                            },
                        ],
                    },
                    'issuetype': {'name': issue_type},
                }
            }
            try:
                res = http_requests.post(endpoint, json=payload, headers=headers, timeout=10)
                if not res.ok:
                    try:
                        err_body = res.json()
                    except Exception:
                        err_body = res.text
                    results.append({'id': fb.id, 'ok': False, 'error': f'HTTP {res.status_code}: {err_body}'})
                    continue
                issue_key = res.json().get('key', '')
                fb.jira_issue_key = issue_key
                fb.save(update_fields=['jira_issue_key'])
                results.append({'id': fb.id, 'issue_key': issue_key, 'ok': True})
            except http_requests.RequestException as e:
                results.append({'id': fb.id, 'ok': False, 'error': str(e)})

        return Response({'results': results})


class AdminUserListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        User = get_user_model()
        users = User.objects.all().order_by('-date_joined')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'date_joined': u.date_joined,
                'last_login': u.last_login,
                'is_active': u.is_active,
                'is_staff': u.is_staff,
            }
            for u in users
        ]
        return Response(data)


class AdminUserPasswordResetView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, user_id):
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'ユーザーが見つかりません'}, status=status.HTTP_404_NOT_FOUND)

        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        user.set_password(new_password)
        user.save()
        return Response({'password': new_password})
