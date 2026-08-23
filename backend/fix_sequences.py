import os

import psycopg2
from psycopg2 import sql


def repair_missing_id_defaults():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("[SEQUENCE REPAIR] DATABASE_URL is not set; nothing to repair.", flush=True)
        return

    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT table_name, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND column_name = 'id'
                  AND data_type IN ('bigint', 'integer')
                ORDER BY table_name
                """
            )
            tables = cursor.fetchall()

            for table_name, column_default in tables:
                if column_default:
                    continue

                sequence_name = f"{table_name}_id_seq"
                table_identifier = sql.Identifier("public", table_name)
                sequence_identifier = sql.Identifier("public", sequence_name)

                cursor.execute(
                    sql.SQL("CREATE SEQUENCE IF NOT EXISTS {}")
                    .format(sequence_identifier)
                )
                cursor.execute(
                    sql.SQL(
                        "SELECT setval(%s, COALESCE(MAX(id), 0) + 1, false) FROM {}"
                    ).format(table_identifier),
                    (f"public.{sequence_name}",),
                )
                cursor.execute(
                    sql.SQL(
                        "ALTER TABLE {} ALTER COLUMN id SET DEFAULT nextval(%s)"
                    ).format(table_identifier),
                    (f"public.{sequence_name}",),
                )
                cursor.execute(
                    sql.SQL("ALTER SEQUENCE {} OWNED BY {}.id")
                    .format(sequence_identifier, table_identifier)
                )
                print(
                    f"[SEQUENCE REPAIR] Restored public.{table_name}.id using {sequence_name}",
                    flush=True,
                )

        connection.commit()


if __name__ == "__main__":
    repair_missing_id_defaults()
