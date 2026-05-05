from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='feedback',
            name='jira_issue_key',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
    ]
