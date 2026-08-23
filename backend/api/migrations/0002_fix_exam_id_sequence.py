from django.db import migrations


SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relkind = 'S' AND relname = 'api_exam_id_seq'
    ) THEN
        CREATE SEQUENCE api_exam_id_seq;
    END IF;

    PERFORM setval(
        'api_exam_id_seq',
        COALESCE((SELECT MAX(id) FROM api_exam), 0) + 1,
        false
    );

    ALTER TABLE api_exam
        ALTER COLUMN id SET DEFAULT nextval('api_exam_id_seq');

    ALTER SEQUENCE api_exam_id_seq
        OWNED BY api_exam.id;
END
$$;
"""


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=SQL,
            reverse_sql=(
                "ALTER TABLE api_exam ALTER COLUMN id DROP DEFAULT;"
            ),
        ),
    ]
