# Local projects and templates

Phase 09 stores projects in a versioned IndexedDB database named `qr-studio-pro`. The `projects` object store uses the project UUID as its key and indexes `updatedAt`. Writes complete only when the transaction completes; quota, blocked database, request, and transaction errors are surfaced to the interface.

The current schema version is `1`. Every stored record and portable JSON file carries a schema version. Imports pass through strict structural validation and the migration entry point before they can be written. Unknown versions, malformed JSON, invalid image data URLs, external image URLs, and files larger than 7 MB are rejected. Future migrations must be added explicitly and must never execute imported content.

Projects contain the editable content workspace, encoded payload evidence, shape and color design, logo data, background, correction level, quiet zone, and export preferences. Logo source and rendered data URLs remain local and portable; temporary object URLs are never persisted.

Autosave is disabled by default, debounced, scoped to the currently opened project, and guarded against stale asynchronous completion. Sensitive content cannot be saved until the user explicitly consents. Wi-Fi passwords are therefore never autosaved unless the project was first deliberately saved with sensitive-data consent.

IndexedDB is local browser storage, not an encrypted vault. Clearing site data, private browsing policies, storage eviction, or browser-profile loss can remove projects. Portable JSON exports are also unencrypted and should be protected like the data they contain.

The twelve templates contain real editable `QrDesignSettings`. Applying one preserves the current payload, logo, export size, and correction level. Content-specific templates show a compatibility warning when applied to another content type.
