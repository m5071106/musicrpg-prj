from django.db import models
from apps.users.models import User

INSTRUMENT_CHOICES = [
    ('piano', 'Piano'),
    ('esax', 'Electric Sax'),
    ('vocal', 'Vocal'),
]


class MusicProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='music_profile')
    instrument = models.CharField(max_length=10, choices=INSTRUMENT_CHOICES, default='piano')
    stat_tempo = models.PositiveSmallIntegerField(default=3)
    stat_emotion = models.PositiveSmallIntegerField(default=3)
    stat_range = models.PositiveSmallIntegerField(default=3)
    stat_effort = models.PositiveSmallIntegerField(default=3)
    stat_stage = models.PositiveSmallIntegerField(default=3)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.display_name or self.user.username} ({self.instrument})'


class Song(models.Model):
    profile = models.ForeignKey(MusicProfile, on_delete=models.CASCADE, related_name='songs')
    title = models.CharField(max_length=100)
    stars = models.PositiveSmallIntegerField(default=3)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-added_at']

    def __str__(self):
        return self.title
