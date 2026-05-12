import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    BNRT-19: PWA/ブラウザ間のデータ連携のため、
    ComparePartner と CompareSession をサーバー側に追加する。
    """

    dependencies = [
        ('music', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ComparePartner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('partner_username', models.CharField(max_length=150)),
                ('partner_instrument', models.CharField(
                    choices=[('piano', 'Piano'), ('esax', 'Electric Sax'), ('vocal', 'Vocal')],
                    max_length=10,
                )),
                ('partner_songs', models.JSONField(default=list)),
                ('partner_stats', models.JSONField(default=dict)),
                ('scanned_at', models.DateTimeField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='compare_partners',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-scanned_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='comparepartner',
            constraint=models.UniqueConstraint(
                fields=['user', 'partner_username'],
                name='unique_user_partner',
            ),
        ),
        migrations.CreateModel(
            name='CompareSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('client_id', models.CharField(max_length=64, unique=True)),
                ('partner_username', models.CharField(max_length=150)),
                ('partner_instrument', models.CharField(
                    choices=[('piano', 'Piano'), ('esax', 'Electric Sax'), ('vocal', 'Vocal')],
                    max_length=10,
                )),
                ('played_songs', models.JSONField(default=list)),
                ('session_date', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='compare_sessions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-session_date'],
            },
        ),
    ]
