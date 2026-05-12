from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import MusicProfile, Song, ComparePartner, CompareSession
from .serializers import (
    MusicProfileSerializer,
    SongSerializer,
    ComparePartnerSerializer,
    CompareSessionSerializer,
)


class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = MusicProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = MusicProfile.objects.get_or_create(user=self.request.user)
        return profile


class SongListCreateView(generics.ListCreateAPIView):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Song.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        profile, _ = MusicProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class SongDestroyView(generics.DestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Song.objects.filter(profile__user=self.request.user)


# ── パートナー管理（PWA/ブラウザ間データ共有用） ──────────────────────────────

class ComparePartnerListCreateView(generics.ListCreateAPIView):
    """
    GET  /music/partners/  : ログイン中ユーザーのパートナー一覧を取得する
    POST /music/partners/  : パートナーを新規保存、または既存レコードを更新する
                             (partner_username が同一の場合は upsert)
    """
    serializer_class = ComparePartnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ComparePartner.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        partner_username = serializer.validated_data['partner_username']

        # 同一ユーザー・同一パートナーのレコードが既にあれば更新（upsert）
        obj, created = ComparePartner.objects.update_or_create(
            user=request.user,
            partner_username=partner_username,
            defaults={
                'partner_instrument': serializer.validated_data['partner_instrument'],
                'partner_songs': serializer.validated_data['partner_songs'],
                'partner_stats': serializer.validated_data['partner_stats'],
                'scanned_at': serializer.validated_data['scanned_at'],
            },
        )
        out = self.get_serializer(obj)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(out.data, status=status_code)


class ComparePartnerDestroyView(generics.DestroyAPIView):
    """
    DELETE /music/partners/<pk>/  : 指定パートナーを削除する
    """
    serializer_class = ComparePartnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ComparePartner.objects.filter(user=self.request.user)


# ── セッション履歴管理（PWA/ブラウザ間データ共有用） ─────────────────────────

class CompareSessionListCreateView(generics.ListCreateAPIView):
    """
    GET  /music/sessions/  : ログイン中ユーザーのセッション履歴一覧を取得する
    POST /music/sessions/  : セッションを保存する（client_id が同じ場合は重複保存しない）
    """
    serializer_class = CompareSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CompareSession.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client_id = serializer.validated_data['client_id']

        # client_id が同一のレコードが既にあれば重複保存しない（冪等性の確保）
        obj, created = CompareSession.objects.get_or_create(
            client_id=client_id,
            defaults={
                'user': request.user,
                'partner_username': serializer.validated_data['partner_username'],
                'partner_instrument': serializer.validated_data['partner_instrument'],
                'played_songs': serializer.validated_data['played_songs'],
                'session_date': serializer.validated_data['session_date'],
            },
        )
        out = self.get_serializer(obj)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(out.data, status=status_code)


class CompareSessionDestroyView(generics.DestroyAPIView):
    """
    DELETE /music/sessions/<pk>/  : 指定セッションを削除する
    """
    serializer_class = CompareSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CompareSession.objects.filter(user=self.request.user)
