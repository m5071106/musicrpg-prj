from rest_framework import serializers
from .models import MusicProfile, Song, ComparePartner, CompareSession


class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ['id', 'title', 'stars', 'added_at', 'mb_id', 'mb_title']
        read_only_fields = ['id', 'added_at']

    def validate_stars(self, v):
        if not 1 <= v <= 5:
            raise serializers.ValidationError('1〜5 の値を指定してください')
        return v


class MusicProfileSerializer(serializers.ModelSerializer):
    songs = SongSerializer(many=True, read_only=True)

    class Meta:
        model = MusicProfile
        fields = [
            'id', 'instruments',
            'stat_tempo', 'stat_emotion', 'stat_range',
            'stat_effort', 'stat_stage',
            'updated_at', 'songs',
        ]
        read_only_fields = ['id', 'updated_at']

    def validate_instruments(self, v):
        if not isinstance(v, list) or not (1 <= len(v) <= 3):
            raise serializers.ValidationError('楽器は1〜3つ指定してください')
        for inst in v:
            if not isinstance(inst, str) or not inst.strip():
                raise serializers.ValidationError('楽器名は空でない文字列で指定してください')
        return v

    def validate_stat_tempo(self, v):
        if not 1 <= v <= 5:
            raise serializers.ValidationError('1〜5 の値を指定してください')
        return v

    def validate_stat_emotion(self, v):
        if not 1 <= v <= 5:
            raise serializers.ValidationError('1〜5 の値を指定してください')
        return v

    def validate_stat_range(self, v):
        if not 1 <= v <= 5:
            raise serializers.ValidationError('1〜5 の値を指定してください')
        return v

    def validate_stat_effort(self, v):
        if not 1 <= v <= 5:
            raise serializers.ValidationError('1〜5 の値を指定してください')
        return v

    def validate_stat_stage(self, v):
        if not 1 <= v <= 5:
            raise serializers.ValidationError('1〜5 の値を指定してください')
        return v


class ComparePartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComparePartner
        fields = [
            'id',
            'partner_username',
            'partner_instruments',
            'partner_songs',
            'partner_stats',
            'scanned_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def validate_partner_instruments(self, v):
        if not isinstance(v, list):
            raise serializers.ValidationError('リスト形式で指定してください')
        return v

    def validate_partner_songs(self, v):
        if not isinstance(v, list):
            raise serializers.ValidationError('リスト形式で指定してください')
        return v

    def validate_partner_stats(self, v):
        required_keys = {'stat_tempo', 'stat_emotion', 'stat_range', 'stat_effort', 'stat_stage'}
        if not isinstance(v, dict) or not required_keys.issubset(v.keys()):
            raise serializers.ValidationError(
                f'partner_stats には {required_keys} のキーが必要です'
            )
        return v


class CompareSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompareSession
        fields = [
            'id',
            'client_id',
            'partner_username',
            'partner_instruments',
            'played_songs',
            'session_date',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_played_songs(self, v):
        if not isinstance(v, list):
            raise serializers.ValidationError('リスト形式で指定してください')
        return v
