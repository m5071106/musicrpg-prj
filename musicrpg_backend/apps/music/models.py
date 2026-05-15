from django.db import models
from apps.users.models import User


class MusicProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='music_profile')
    instruments = models.JSONField(default=list)  # up to 3 instrument strings
    stat_tempo = models.PositiveSmallIntegerField(default=3)
    stat_emotion = models.PositiveSmallIntegerField(default=3)
    stat_range = models.PositiveSmallIntegerField(default=3)
    stat_effort = models.PositiveSmallIntegerField(default=3)
    stat_stage = models.PositiveSmallIntegerField(default=3)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        insts = ', '.join(self.instruments) if self.instruments else 'none'
        return f'{self.user.display_name or self.user.username} ({insts})'


class Song(models.Model):
    profile = models.ForeignKey(MusicProfile, on_delete=models.CASCADE, related_name='songs')
    title = models.CharField(max_length=100)
    stars = models.PositiveSmallIntegerField(default=3)
    added_at = models.DateTimeField(auto_now_add=True)
    # MusicBrainz Recording ID（UUID 形式、未登録時は空文字）
    mb_id = models.CharField(max_length=36, blank=True, default='')
    # MusicBrainz から取得した公式タイトル
    mb_title = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-added_at']

    def __str__(self):
        return self.title


class ComparePartner(models.Model):
    """
    ユーザーがQRスキャンで交換した相手のプロフィールをサーバーに保存するモデル。
    PWA・ブラウザ間でパートナー情報を共有するために使用する。
    """
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='compare_partners'
    )
    partner_username = models.CharField(max_length=150)
    partner_instruments = models.JSONField(default=list)  # up to 3 instrument strings
    # パートナーの曲リスト: [{"title": "...", "stars": N}, ...]
    partner_songs = models.JSONField(default=list)
    # パートナーのステータス: {"stat_tempo": N, ...}
    partner_stats = models.JSONField(default=dict)
    scanned_at = models.DateTimeField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scanned_at']
        # 同一ユーザーが同一パートナーを複数回スキャンした場合は1件に集約する
        unique_together = [('user', 'partner_username')]

    def __str__(self):
        return f'{self.user.username} → {self.partner_username}'


class CompareSession(models.Model):
    """
    比較画面でユーザーが記録したセッション（演奏した曲など）をサーバーに保存するモデル。
    PWA・ブラウザ間で履歴を共有するために使用する。
    """
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='compare_sessions'
    )
    # フロントエンドで生成したユニーク ID（重複登録防止に使用）
    client_id = models.CharField(max_length=64, unique=True)
    partner_username = models.CharField(max_length=150)
    partner_instruments = models.JSONField(default=list)  # up to 3 instrument strings
    # 演奏した曲タイトルのリスト: ["title1", "title2", ...]
    played_songs = models.JSONField(default=list)
    session_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-session_date']

    def __str__(self):
        return f'{self.user.username} × {self.partner_username} ({self.session_date:%Y-%m-%d})'
