from django.db import migrations, models


def convert_instrument_to_list(apps, schema_editor):
    MusicProfile = apps.get_model('music', 'MusicProfile')
    for profile in MusicProfile.objects.all():
        profile.instruments = [profile.instrument] if profile.instrument else ['piano']
        profile.save()

    ComparePartner = apps.get_model('music', 'ComparePartner')
    for partner in ComparePartner.objects.all():
        partner.partner_instruments = [partner.partner_instrument] if partner.partner_instrument else []
        partner.save()

    CompareSession = apps.get_model('music', 'CompareSession')
    for session in CompareSession.objects.all():
        session.partner_instruments = [session.partner_instrument] if session.partner_instrument else []
        session.save()


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0003_add_mb_id_to_song'),
    ]

    operations = [
        # 新フィールドを追加
        migrations.AddField(
            model_name='musicprofile',
            name='instruments',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='comparepartner',
            name='partner_instruments',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='comparesession',
            name='partner_instruments',
            field=models.JSONField(default=list),
        ),
        # 旧フィールドから新フィールドへデータ移行
        migrations.RunPython(convert_instrument_to_list, migrations.RunPython.noop),
        # 旧フィールドを削除
        migrations.RemoveField(
            model_name='musicprofile',
            name='instrument',
        ),
        migrations.RemoveField(
            model_name='comparepartner',
            name='partner_instrument',
        ),
        migrations.RemoveField(
            model_name='comparesession',
            name='partner_instrument',
        ),
    ]
