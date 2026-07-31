-- Phase 2 planning decision (CLAUDE.md Section 0, 2026-07-31): the master
-- build brief's Section 19 calls for maximum_coaches/maximum_managers
-- alongside maximum_substitutes/maximum_reserves, but the original Phase 1
-- schema pass omitted them.

alter table tournaments
  add column maximum_coaches int not null default 1,
  add column maximum_managers int not null default 1;
