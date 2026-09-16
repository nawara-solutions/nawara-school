# Erasure runbook

Every entity holding child data is listed here with its erasure procedure across
Postgres, Mongo, S3, and in-scope backups (CLAUDE.md §6.8). Hard-delete or
crypto-shred only — never `deletedAt = now()`.

| Entity | Owning service | Stores | Procedure |
| ------ | --------------- | ------ | --------- |
| _(add a row here in the same PR that introduces a new child-data entity)_ | | | |
