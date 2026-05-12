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


class PartnerRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='partners')
    username = models.CharField(max_length=150)
    instrument = models.CharField(max_length=10)
    songs = models.JSONField(default=list)
    stats = models.JSONField(default=dict)
    scanned_at = models.DateTimeField()

    class Meta:
        ordering = ['-scanned_at']
        unique_together = [('user', 'username')]

    def __str__(self):
        return f'{self.user.username} -> {self.username}'


class SessionRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    client_id = models.CharField(max_length=64, unique=True)
    partner_username = models.CharField(max_length=150)
    partner_instrument = models.CharField(max_length=10)
    played_songs = models.JSONField(default=list)
    date = models.DateTimeField()

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'{self.user.username} x {self.partner_username} ({self.date.date()})'
