from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import MusicProfile, Song, PartnerRecord, SessionRecord
from .serializers import (
    MusicProfileSerializer, SongSerializer,
    PartnerRecordSerializer, SessionRecordSerializer,
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
        if Song.objects.filter(profile=profile).count() >= 50:
            raise ValidationError('登録できる曲は最大50曲です。不要な曲を削除してから追加してください。')
        serializer.save(profile=profile)


class SongDestroyView(generics.DestroyAPIView):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Song.objects.filter(profile__user=self.request.user)


class PartnerListCreateView(generics.ListCreateAPIView):
    serializer_class = PartnerRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PartnerRecord.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # upsert: update existing record for this partner username
        username = serializer.validated_data.get('username')
        PartnerRecord.objects.filter(user=self.request.user, username=username).delete()
        serializer.save(user=self.request.user)


class SessionBulkSyncView(generics.GenericAPIView):
    serializer_class = SessionRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = SessionRecord.objects.filter(user=request.user)
        serializer = SessionRecordSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Accept a list of session records; skip duplicates by client_id
        records = request.data if isinstance(request.data, list) else [request.data]
        created = 0
        for item in records:
            client_id = item.get('client_id')
            if not client_id:
                continue
            if SessionRecord.objects.filter(user=request.user, client_id=client_id).exists():
                continue
            serializer = SessionRecordSerializer(data=item)
            if serializer.is_valid():
                serializer.save(user=request.user)
                created += 1
        return Response({'created': created})
