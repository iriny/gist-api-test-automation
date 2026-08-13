# GitHub Gist Web UI - Exploratory Testing Charter Set

Target: gist.github.com (the web UI layered on top of the Gists API this repo tests). This is a suggested charter set for holistic exploratory coverage - it has not been executed, so it contains no findings, only what each session should discover and why it matters.

Rationale for going beyond the API suite: the automated suite in this repo verifies the Gists API contract (status codes, payload shapes, data integrity). It cannot tell us whether a human using the actual UI can accomplish the same tasks without confusion, whether the UI correctly surfaces the API's edge-case behavior (e.g. a 404 rendering as a sensible "not found" page instead of a blank screen), or whether visibility/privacy is communicated clearly enough that a user doesn't accidentally leak a secret gist. UI exploratory testing complements the API suite rather than duplicating it.

Priority 1: Given to charters covering the core critical flow - creating, editing, and viewing a gist - since that is the entire purpose of the product.
Risk impact: If a user cannot reliably create or edit a gist through the UI, or loses content while doing so, the product fails at its one job and the user has no reason to trust it with their content again.

Priority 2: Given to charters covering major secondary flows tied to sharing, privacy, and collaboration - visibility, starring, forking, comments, embedding.
Risk impact: These are the features that make a gist more than a text file - they enable sharing and collaboration. A bug here (e.g. a secret gist accidentally rendered discoverable, or a broken embed) damages user trust and can leak content the user believed was private, even though the underlying API-level visibility guarantee is already covered by automation.

Priority 3: Given to charters covering discovery, history, first-time experience, and accessibility.
Risk impact: Weaknesses here frustrate or exclude users (new users abandoning during onboarding, keyboard/screen-reader users unable to use the editor) but don't put data at risk or block the core flow for an established user.

---

Priority 1
> Explore: Create gist action
With: "Create new gist" page - description field, filename, content editor, visibility toggle, "Create gist" button
To discover: Whether a user can reliably create a single- or multi-file gist and immediately see it rendered correctly

Summary:
- User can create a gist with one file and no description
- User can add multiple files to the same gist before saving
- User can set a filename that implies a language (e.g. `.py`, `.md`) and see syntax highlighting applied after save
- User can leave a filename blank and see the UI assign or request one
- User is prevented from saving a gist with zero files or all-empty files, with a clear inline message (mirrors the API's rejection of empty `files`)

---

Priority 1
> Explore: Edit and update gist action
With: Gist edit view - existing gist opened in edit mode
To discover: Whether in-place edits (content, filename, add/remove file) save correctly and are reflected immediately in the rendered view

Summary:
- User can edit the content of an existing file and save
- User can rename a file and see the old name replaced, not duplicated
- User can add a new file to an existing gist
- User can remove a file from a multi-file gist without affecting the others
- User can navigate away mid-edit and is warned about unsaved changes

---

Priority 1
> Explore: Delete gist action
With: Gist settings/delete control on an owned gist
To discover: Whether deletion is intentional (not a misclick hazard) and whether the UI's post-delete state is coherent

Summary:
- User is asked to confirm before a gist is permanently deleted
- User is redirected to a sensible location after deletion (not a broken/blank page)
- User revisiting a bookmarked link to the deleted gist sees a clear "not found" state, not a raw error

---

Priority 2
> Explore: Visibility (public vs. secret) in the UI
With: Visibility toggle at gist creation and on the gist's own page
To discover: Whether the UI communicates visibility state clearly enough that a user never mistakes a secret gist for private-in-the-strict-sense, or a public gist for hidden

Summary:
- User can choose public or secret at creation time and the choice is visibly labeled afterward
- User can tell, at a glance on the gist page, whether it is public or secret
- User understands (via UI copy) that "secret" means unlisted-but-accessible-by-link, not access-controlled - this is the single highest-risk misunderstanding for this product
- Secret gists do not surface in the public discovery feed or search

---

Priority 2
> Explore: Star / unstar a gist
With: Star control on a gist page and the "starred" listing under the user's gists
To discover: Whether starring behaves predictably and is reflected consistently across views

Summary:
- User can star a gist and see the control change state immediately
- User can find the gist again under their starred list
- User can unstar and see it removed from the starred list
- Starring someone else's gist doesn't alter the gist itself (no ownership/visibility side effects)

---

Priority 2
> Explore: Fork a gist
With: Fork control on someone else's gist
To discover: Whether the forked copy is clearly distinguished from the original and the relationship between them is visible in both directions

Summary:
- User can fork a public gist and lands on their own editable copy
- User can see, from the fork, a link back to the original
- User can see, from the original, that a fork exists (and who made it)
- User cannot fork their own gist (or the UI explains why the action is unavailable)

---

Priority 2
> Explore: Comments on a gist
With: Comment box on a gist page
To discover: Whether commenting, editing, and deleting comments work and are ordered/attributed correctly

Summary:
- User can post a comment and see it appear attributed to their account with a timestamp
- User can edit their own comment and see an "edited" indicator
- User can delete their own comment
- User cannot edit or delete another user's comment
- Comments render user-supplied Markdown safely (no script injection, no broken layout from malformed input)

---

Priority 2
> Explore: Share and embed a gist
With: "Embed" / clone URL / raw file link controls on a gist page
To discover: Whether the sharing affordances actually produce usable, correctly-scoped links

Summary:
- User can copy an embed `<script>` snippet and it renders the gist correctly on an external page
- User can copy the raw content URL and it serves the exact file content
- User can copy a git clone URL and successfully clone the gist as a repo
- Embed/raw links for a secret gist still require knowledge of the unguessable URL (consistent with the "secret" model above) and are not indexed/discoverable

---

Priority 3
> Explore: Gist listing, search, and discovery
With: "Your gists", public gist discovery feed, and search
To discover: Whether a user can find their own past gists and reasonably browse public ones

Summary:
- User can see all of their own gists (public and secret) listed with distinguishing labels
- User can search their own gists by filename or content
- User can browse or search public gists without being authenticated
- Pagination/infinite-scroll on long gist lists behaves consistently (no duplicate or skipped entries between pages) - the API-level pagination edge cases (clamping, out-of-range pages) are already automation-covered; this charter checks the UI's handling of those responses

---

Priority 3
> Explore: Revision history
With: "Revisions" view on a gist with multiple edits
To discover: Whether a user can inspect and understand what changed between versions

Summary:
- User can see a list of revisions with timestamps
- User can view a diff between two revisions
- User can view or restore an older revision's content

---

Priority 3
> Explore: New user first-time experience
With: A logged-in user with zero existing gists
To discover: Whether the empty state guides a first-time user toward creating their first gist

Summary:
- User sees a clear empty state (not a blank page) when they have no gists yet
- User sees inline guidance or a prominent call-to-action to create a gist
- User can complete their first gist creation without needing external documentation

---

Priority 3
> Explore: Accessibility and responsive layout
With: Keyboard-only navigation, screen reader, and a narrow/mobile viewport
To discover: Whether the create/edit/view flows are usable without a mouse or on a small screen

Summary:
- User can create and edit a gist using only the keyboard (tab order reaches all controls, editor is operable)
- User relying on a screen reader can identify file boundaries, visibility state, and comment authorship
- User on a mobile-width viewport can read code without horizontal scrolling breaking the layout
- Syntax-highlighted code retains sufficient color contrast in both light and dark themes
