---
name: Orval schema naming
description: Avoiding zod const name collisions in orval codegen for this repo's OpenAPI spec
---
Rule: don't name OpenAPI response schemas `<Operation>Response` when the operation id would make orval emit a zod const of the same name.

**Why:** During the free-flow converse endpoint work, a schema named `ConverseResponse` collided with orval's auto-generated zod response const, breaking codegen. Renaming the schema to `SheepReply` fixed it.

**How to apply:** When adding schemas to `lib/api-spec/openapi.yaml`, give response bodies domain names (e.g. `SheepReply`) rather than `<X>Response`, then run `pnpm --filter @workspace/api-spec run codegen`.
