# Data Model

Database schemas and entity relationships.

## Naming Convention

- Tables: `tb_<entity>`
- Primary key: `pk_<entity>` (UUID)
- Index: `idx_<entity>` (auto-increment)
- Foreign key: `fk_<referenced_entity>`
- Timestamps: `ts_<entity>_created_at`, `ts_<entity>_updated_at`
- Text: `tx_<field>`
- Number: `nr_<field>`
- Boolean: `bl_<field>`
- Date: `dt_<field>`
