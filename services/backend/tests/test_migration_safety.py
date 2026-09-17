import ast
from pathlib import Path


def test_migration_410dc7af25ff_has_safe_default_for_existing_rows() -> None:
    """Verify that Alembic migration 410dc7af25ff safely adds the processing_attempts column.

    Adding a NOT NULL column without a server default fails on tables with existing rows.
    This test verifies that:
    1. A server default of '0' is provided during column addition.
    2. The server default is removed afterwards so the ORM controls runtime defaults.
    3. The downgrade function drops the columns properly.
    """
    migration_path = (
        Path(__file__).parent.parent
        / "alembic"
        / "versions"
        / "410dc7af25ff_add_webhook_retry_fields.py"
    )
    assert migration_path.exists(), f"Migration file not found at {migration_path}"

    source = migration_path.read_text(encoding="utf-8")
    tree = ast.parse(source)

    # Inspect functions in the migration module
    functions = {
        node.name: node for node in tree.body if isinstance(node, ast.FunctionDef)
    }
    assert "upgrade" in functions, "Migration missing upgrade() function"
    assert "downgrade" in functions, "Migration missing downgrade() function"

    # Verify upgrade() contains server_default='0' for processing_attempts
    assert "server_default='0'" in source or 'server_default="0"' in source, (
        "Column 'processing_attempts' must specify a server_default='0' to safely support existing rows"
    )

    # Verify alter_column is used to clear server_default afterwards
    assert "alter_column('processing_attempts', server_default=None)" in source, (
        "Migration should remove the server_default after adding to maintain ORM-controlled defaults"
    )

    # Verify downgrade drops both processing_attempts and next_retry_at
    downgrade_source = ast.get_source_segment(source, functions["downgrade"]) or ""
    assert "drop_column('processing_attempts')" in downgrade_source
    assert "drop_column('next_retry_at')" in downgrade_source
