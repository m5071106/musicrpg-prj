import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MusicProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('instrument', models.CharField(
                    choices=[('piano', 'Piano'), ('esax', 'Electric Sax'), ('vocal', 'Vocal')],
                    default='piano',
                    max_length=10,
                )),
                ('stat_tempo', models.PositiveSmallIntegerField(default=3)),
                ('stat_emotion', models.PositiveSmallIntegerField(default=3)),
                ('stat_range', models.PositiveSmallIntegerField(default=3)),
                ('stat_effort', models.PositiveSmallIntegerField(default=3)),
                ('stat_stage', models.PositiveSmallIntegerField(default=3)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='music_profile',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.CreateModel(
            name='Song',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100)),
                ('stars', models.PositiveSmallIntegerField(default=3)),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('profile', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='songs',
                    to='music.musicprofile',
                )),
            ],
            options={
                'ordering': ['-added_at'],
            },
        ),
    ]
