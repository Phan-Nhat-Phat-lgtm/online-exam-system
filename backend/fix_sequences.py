import os

import psycopg2
from psycopg2 import sql


def repair_missing_id_defaults():
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print("[SEQUENCE REPAIR] DATABASE_URL is not set; nothing to repair.", flush=True)
        return

    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT table_name, column_default, is_identity
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND column_name = 'id'
                  AND data_type IN ('bigint', 'integer')
                ORDER BY table_name
                """
            )
            tables = cursor.fetchall()

            for table_name, column_default, is_identity in tables:
                if column_default:
                    continue

                # Cột id dạng IDENTITY (PostgreSQL 10+) tự sinh số, không cần sửa
                if (is_identity or "").upper() == "YES":
                    print(
                        f"[SEQUENCE REPAIR] Skip {table_name}: id is an identity column",
                        flush=True,
                    )
                    continue

                sequence_name = f"{table_name}_id_seq"
                table_identifier = sql.Identifier("public", table_name)
                sequence_identifier = sql.Identifier("public", sequence_name)

                try:
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
                except Exception as table_error:
                    # Một bảng lỗi thì bỏ qua, không làm hỏng cả quá trình deploy
                    print(
                        f"[SEQUENCE REPAIR] Warning: skip {table_name}: {table_error}",
                        flush=True,
                    )

        connection.commit()


if __name__ == "__main__":
    repair_missing_id_defaults()
