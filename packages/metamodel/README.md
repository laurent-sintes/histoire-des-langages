# Knowledge metamodel

`model.ts` is the canonical model of the graph. It defines the editorial schema, the vocabulary, relation signatures, and the criteria for publishing qualified records. It contains no historical entries.

The JSON Schema is generated for editing the corpus. The compiler applies the metamodel's relation signatures and checks cross-record references and citations. The browser imports the compiled model and uses its typed read API. All field names and controlled values are in English. Stable IDs and editorial content are preserved across vocabulary migrations.

Run `pnpm schema`, `pnpm check`, `pnpm test`, and `pnpm build:model` after a contract change. See the [project invariants](../../AGENTS.md) and the [knowledge model](../../docs/modele-connaissance.md).
