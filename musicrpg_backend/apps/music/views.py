from rest_framework import generics, permissions
from .models import MusicProfile, Song
from .serializers import MusicProfileSerializer, SongSerializer


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
