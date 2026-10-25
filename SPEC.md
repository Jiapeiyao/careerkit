# CareerKit: Product and Technical Specification

Status: Initial specification after product discovery.

The confirmed scope defines the first release. Proposed designs describe implementation choices, not additional product commitments. Open decisions appear in Section 17.

## 1. Product purpose

CareerKit helps experienced job seekers turn their career materials into a new resume for a specific job.

The product replaces a workflow that currently requires an IDE, Markdown files, writing instructions, and manual version management. Users interact through a website. They do not need to manage folders, install agent skills, or create files themselves.

An agent is an LLM that uses tools to complete tasks. A job description, or JD, describes a target role.

The first release supports one complete task:

> Paste a JD and career materials, resolve important questions, approve the facts, and produce a tailored resume with a PDF download.

The long-term product can support other career writing and questions. Those capabilities are outside the first release.

## 2. Confirmed product decisions

| Area | Decision |
| --- | --- |
| Primary user | An experienced job seeker with existing career materials |
| Primary task | Generate a resume from a JD and personal materials |
| Main interaction | A conversation with an agent |
| Organization | The agent proposes projects and organizes materials |
| Input | Pasted text only |
| Source types | Old resumes, performance reviews, work experience, glossaries, role timelines, and other context |
| Fact handling | Extract experience records and ask important questions before resume generation |
| Writing policy | Use supported facts and preserve contribution boundaries |
| Write permission | Every change to business content requires user approval |
| Automatic persistence | Conversation messages, task progress, and audit records |
| Output | Web preview, text copy, and a PDF with stable layout |
| Languages | Chinese or English on request, with independently editable versions |
| Language freshness | Flag related versions when their supporting facts change |
| Deployment | A hosted website with multiple users and accounts |
| Model access | The website supplies the model service |
| Web stack | Next.js with TypeScript for the frontend and web backend functions |
| Package manager | pnpm, with its version pinned in `package.json` and dependencies locked in `pnpm-lock.yaml` |
| UI stack | Tailwind CSS for styles and shadcn/ui for component source |
| Agent stack | Server-side TypeScript in the same Next.js application. No separate Python service for now |
| Database | PostgreSQL |
| Authentication | Supabase Auth with Google and GitHub sign-in. No app-managed passwords or authentication email sender |
| Content storage | PostgreSQL is the authoritative store for text and business state. Markdown does not require file storage |
| File storage | Object storage holds generated PDFs and other binary artifacts, not a second editable copy of document text |
| State ownership | The backend validates and commits changes. The frontend displays state and submits user intent |
| Change representation | Versioned proposals contain candidate content. The backend computes differences for review |
| Agent execution | Stateless server instances use externally persisted task and conversation state |
| Agent framework | Undecided |
| Specification language | English |

## 3. Scope

### 3.1 First-release capabilities

The first release must provide:

1. Account authentication and private user workspaces.
2. A conversation that accepts pasted materials and a JD.
3. Proposed organization of sources and target-job projects.
4. Extraction of career facts with links to their sources.
5. Focused questions about material gaps and conflicts.
6. Explicit approval before business content changes.
7. Resume generation from approved facts for a selected target job.
8. Conversational revision and version history.
9. Chinese or English resume generation on request.
10. Web preview, text copy, and PDF download.
11. Visible task progress, failures, and recovery controls.
12. Deletion controls for user data.

### 3.2 Exclusions

The first release does not include:

- File uploads, folder imports, or automatic reading of the existing career directory.
- PDF parsing, Word parsing, image recognition, or scanned document processing.
- Automatic retrieval of a JD from a web address.
- General career advice as a separate product workflow.
- Interview questions or reference answers.
- Company, role, compensation, or offer comparison.
- Generation of performance reviews or work reports.
- Cover letters or application form answers.
- Markdown or Word downloads.
- Automatic job applications, recruiter messages, or external publication.
- A user-managed skill system or an IDE-style file browser.

Performance reviews are supported inputs, not supported generated outputs. Existing career files inform the product design but do not require a migration feature.

## 4. User experience

### 4.1 Conversation as the main interface

The conversation is the main entry point. The agent proposes the next action from the conversation and the selected project.

Supporting panels make stored content visible. Users must not depend on chat history to find their sources, facts, resumes, or pending approvals.

The proposed layout contains:

- A conversation panel.
- A project selector with the active target job.
- A context panel for sources, facts, and the resume preview.
- An approval panel for proposed changes.
- A history view for approved resume versions.

This layout supports the conversation. It does not require users to follow a separate wizard.

#### Shared top navigation

Every ordinary page shares a top navigation bar, including the login page.
Standard page errors and 404 pages retain the bar when the root layout can render.
The bar scrolls with the page and uses the same left-right layout on mobile.

- The left side contains a briefcase icon and the CareerKit name, linked to the home page.
- Anonymous users see one sign-in and registration button on the right, except on the login page.
- Signed-in users see an avatar that opens a menu with their name, email address, and sign-out action.
- Missing or failed avatar images use the first letter of the user name, or a generic user icon when no name exists.
- Account details load independently from the page content.
- Feature links and project switching are not part of the initial navigation bar.

### 4.2 First successful session

1. The user signs in and starts a conversation.
2. The user pastes a JD and career materials.
3. The agent identifies source types and proposes a target-job project.
4. The user approves the project and the proposed source records.
5. The agent extracts facts and identifies important gaps or conflicts.
6. The user answers questions and approves the resulting facts.
7. The agent proposes a resume plan and generates a candidate.
8. The user reviews the candidate and approves its creation.
9. The user requests revisions and approves each resulting version.
10. The user opens the preview, copies the text, or downloads the PDF.

Related changes can appear in one approval card. Each affected entity and operation must remain visible.

The agent can prepare proposals from submitted text before source approval. It must not generate a resume until the selected supporting facts receive approval.

### 4.3 Returning session

The user can select an existing project or request a new target job through the conversation.

The agent can propose reuse of approved facts. It must keep each target job and its resume versions separate.

If the intended project is unclear, the agent must ask. It must not apply a change to a guessed project.

## 5. Inputs and source records

A source record stores a submitted text and its identity. A fact is a structured statement approved for reuse.

### 5.1 Supported source types

| Source type | Purpose | Boundary |
| --- | --- | --- |
| JD | Describe the target role and its requirements | It is not evidence of the user's skills |
| Old resume | Supply prior claims and career structure | Claims require approval before reuse |
| Performance review | Supply activities, feedback, and outcomes | Team outcomes do not establish personal ownership |
| Work experience | Supply projects, responsibilities, and results | Missing details remain unknown |
| Glossary | Explain internal names and terminology | An explanation is not a new achievement |
| Role timeline | Describe employer, department, title, and date changes | Conflicting dates require resolution |
| Additional context | Explain constraints or supply other evidence | The same fact and approval rules apply |

### 5.2 Source behavior

The user can assign a title and source type. The agent can propose both when they are absent.

The system must preserve the submitted text. Corrections create source revisions instead of silently replacing prior text.

The system must distinguish a pasted date from a date inferred by the model. Important inferred dates require a question.

Long input must receive an explicit size limit before submission. Input that exceeds the limit must not be silently truncated.

A web address in pasted text remains text. The first release does not retrieve its contents.

## 6. Facts and clarification

### 6.1 Proposed fact structure

Experience facts can contain:

- Employer, department, role, and relevant dates.
- Project or work context.
- The problem or objective.
- The user's responsibilities and contribution.
- Actions and technical decisions.
- Outcomes and supporting metrics.
- Delivery stage, such as exploration, pilot, or production use.
- Disclosure constraints.
- References to source revisions and text spans.

A text span is an exact passage within a source.

Not every fact needs every field. The agent must not invent values to complete a structure.

### 6.2 Clarification policy

The agent must ask when uncertainty changes the meaning of a claim. Examples include personal ownership, outcome strength, employment dates, and deployment status.

The agent must not demand metrics when none exist. A supported qualitative outcome is acceptable.

The agent must group related questions and explain why they matter. It must not repeatedly ask about facts that remain unchanged and approved.

If sources conflict, the agent must show the conflicting passages. The user can correct the facts, exclude the claim, or leave it unresolved.

Unresolved claims cannot support a generated resume. The user can approve an explicit exclusion and continue without them.

### 6.3 Truth and writing boundaries

Resume generation must follow these rules:

- Do not invent employers, dates, titles, skills, metrics, responsibilities, or outcomes.
- Do not turn a team result into an individual achievement.
- Do not turn participation into ownership or management.
- Do not describe an experiment as a production delivery.
- Do not treat a JD requirement as evidence of a qualification.
- Do not treat generated text as a new source of truth.
- Use a glossary to explain terms, not to expand contribution claims.
- Select and rewrite supported facts for relevance.
- Preserve qualifications that limit the strength of a claim.
- Exclude details that the user marks as non-disclosable.

User approval permits reuse of a claim. It does not independently prove that the claim is true.

The product must describe its assurance accurately: it traces claims to approved materials. It does not independently certify employment or achievements.

## 7. Approval and persistence

Business content includes projects, source records, facts, target jobs, and resume versions.

An approval proposal describes changes before they take effect. A committed change is an approved change stored as business content.

### 7.1 Automatic records

Sending a message authorizes storage of that message for the conversation. The system can automatically store task progress and audit records.

The interface must state this boundary before the first submission. Saving a message does not authorize its conversion into an approved source or fact.

Proposed changes can persist as conversation or task records. They must remain separate from approved business content and must not support later resume claims.

### 7.2 Required approval

Explicit approval is required before:

- Creating or changing a project.
- Creating or changing a source or fact.
- Creating or changing a target job.
- Creating a resume or saving a revised resume version.
- Deleting business content.
- Replacing or changing the status of an existing saved resume.

An approval card must show the operation, affected records, and proposed values. Updates must show the differences from current values.

The user can approve, reject, or request changes. A requested revision creates an updated proposal that requires approval.

Typing a request to generate or revise content does not approve an unseen result.

Direct user actions can include approval. For example, a save button can state that it commits an edited source or resume.

### 7.3 Commit behavior

The system uses versioned approval proposals.

Each proposal must bind the user, project, operations, and expected record revisions. A server must evaluate ownership and revision conflicts before committing.

For text changes, the backend stores the complete candidate content and computes a diff against the immutable base revision. A diff shows differences between two versions. A text patch alone is not the authoritative proposal.

Approval must remain disabled until generation, validation, and proposal persistence succeed. Streamed partial text remains an unapproved draft.

The frontend submits the proposal ID and the approval action. The backend commits the exact stored candidate after checking ownership, proposal status, and base revisions. Approval must not trigger regeneration.

Once a proposal is ready for review, its content must not change. Requested edits create a new proposal and supersede the old one.

The system must commit an approved batch completely or not at all. Partial application must not leave inconsistent facts or resume versions.

Repeated approval requests must not create duplicate changes. A stale proposal must show a conflict and require a new review.

The agent must not approve its own proposal. Hidden tool calls and conversation text cannot replace the user's approval action.

Direct text edits submit the candidate content and base revision to the backend. A clearly labeled save action can approve that edit, but cannot bypass authorization or revision checks.

### 7.4 Export boundary

Copy and download actions operate on an approved saved resume version. A candidate preview remains visibly unapproved.

A PDF download authorizes creation of an export for that exact version. It does not approve unrelated pending changes.

## 8. Resume generation and revision

### 8.1 Generation context

Each generation uses:

- The selected target-job revision.
- Selected approved facts and their source references.
- Approved glossary and timeline context.
- The requested output language.
- Relevant writing constraints and disclosure restrictions.

The context must not include another user's data or unrelated projects by default.

### 8.2 Generation behavior

The agent selects relevant experiences and rewrites them for the target role. It preserves factual meaning while changing emphasis and structure.

Each factual claim in a candidate must map to approved supporting facts. General section labels and stylistic transitions do not require evidence.

The review interface must expose claim sources. It must separate writing suggestions from claims that need further evidence.

The system must not promise a hiring outcome or a guaranteed screening score.

### 8.3 Revisions and versions

An approved revision creates a new resume version. It must not silently overwrite the previous version.

Each version records its language, target-job revision, fact revisions, parent version, and approval time.

If a revision needs a new fact, the agent must request that fact first. A request for stronger wording is not evidence of a stronger contribution.

Restoring an earlier resume creates an approved new version. It does not erase later history.

### 8.4 Chinese and English versions

The user requests Chinese or English for each resume. The system must not generate both by default.

Versions in different languages remain independently editable. Translation must preserve facts without forcing word-for-word phrasing.

If a supporting fact changes, related versions must show a stale-content warning. No language version changes automatically.

A changed JD must similarly flag affected versions. Revisions use the same approval process.

## 9. Web preview and PDF

The web interface must distinguish the editing preview from the paginated PDF preview.

The PDF renderer must use the saved resume version and an identified template revision. It must not read a changing chat response.

The first release requires:

- Selectable text in Chinese and English.
- Fonts with complete coverage for supported characters.
- No clipped text, overlapping sections, or missing glyphs.
- Page breaks that preserve readable section and bullet structure.
- The same text order and content as the approved version.
- No hidden truncation to meet a page target.
- Repeatable page count and layout for the same version and renderer configuration.

Repeatable layout does not require identical PDF bytes. Export metadata can differ.

The system must identify the exported version and language. A rendering failure must show an error and offer retry.

The exact template, page size, and page-count policy remain open. The system must not assume that every resume fits one page.

## 10. Technical architecture

### 10.1 Next.js application

Next.js owns the website and most web backend functions:

- Account sessions and user-facing routes.
- Conversation, approval, source, and resume interfaces.
- APIs for approved business content.
- Approval commits and authorization.
- Calls to server-side Agent modules.
- Task progress delivery and export access.

API means the interface through which services exchange requests.

The backend owns authoritative state, authorization, validation, revision checks, and commits. The frontend submits user intent and displays backend results.

The frontend can manage input, local edits, diff presentation, and previews. Client state and client-assembled stream text must not become the only record of a change.

### 10.2 TypeScript Agent modules

Server-side TypeScript modules in the Next.js application own the agent workflow and related processing:

- Model calls and context assembly.
- Source classification and fact extraction.
- Clarification planning.
- Resume generation and proposed revisions.
- Structured proposals and generation diagnostics.

The framework choice remains open. The specification does not require a custom agent loop or a named framework.

The project root contains the single Next.js application and its configuration. Pages and route handlers live in `src/app`, and Agent modules live in `src/server/agent`. No monorepo wrapper or separate language server is required.

The agent must produce structured results that a server validates. It must not execute unrestricted SQL or directly bypass approval rules.

SQL is the language used to query PostgreSQL.

### 10.3 PostgreSQL

PostgreSQL stores business records, conversation records, task records, approvals, and audit metadata.

Store submitted source text and document bodies in text fields. Markdown can represent document content without requiring a filesystem or Blob storage.

Store facts, evidence links, ownership, approval states, and revision relationships as structured data. A file-like editing experience does not require a file-based storage model.

Web backend and Agent modules must not maintain separate competing definitions of approved facts. Approved data has one authoritative representation.

Use object storage for generated PDFs and other binary artifacts. Store their ownership, storage references, and exact resume revisions in PostgreSQL.

Do not maintain independently editable copies of the same document in PostgreSQL and object storage. Binary storage does not add file uploads to the first-release scope.

Schema changes must use a controlled migration process. A migration is a versioned change to the database structure.

### 10.4 Service boundary

The browser communicates with the Next.js application. Agent modules run only on the server and are not exposed directly to the browser.

Next.js route handlers must authenticate requests before calling Agent modules with a server-established user identity and project scope. Agent modules must not trust a user ID supplied in a chat message.

Long tasks need durable task records and progress updates. Closing the browser must not incorrectly mark a running task as completed.

Durable means that a record survives a process restart.

Backend execution does not require every operation to become a background task. Reads, approval commits, and direct saves can use ordinary authenticated requests.

The worker mechanism, hosting platform, and PDF service location remain implementation decisions. Vercel Functions is a candidate, not a confirmed hosting choice.

### 10.5 Agent execution and progress

Server instances can be stateless, but Agent tasks must have persisted state. Do not rely on process memory or a live browser connection for continuity.

For each generation request, the backend authenticates the user, saves the message, creates a task, and loads authorized context. The Agent produces a candidate, and the backend validates and saves the proposal before approval.

An Agent loop alternates model calls and tool execution until it reaches a result, needs user input, or reaches a configured limit. Limit steps, elapsed time, output size, and tool execution time.

Tool inputs require structural validation. Tool access uses server-established identity and project scope. Agent tools can read authorized content and create proposals, but cannot commit business changes.

When approval or clarification is required, persist the waiting state and end the current execution. A later authenticated request loads the saved state and continues. Do not keep a function open while waiting for a user.

Persist completed steps and tool results during execution, not only after the final response. For database changes, commit the change and its execution record in one transaction.

Use idempotency keys for operations with side effects. An idempotency key prevents a repeated request from repeating the same change. External operations need an equivalent retry safeguard.

Use Server-Sent Events (SSE) to send progress from the backend to the frontend. Events can carry draft text, tool status, proposal readiness, and explicit errors.

SSE is a delivery channel, not the task store. Mark partial output as generating or unapproved, and reload authoritative state from the backend after reconnecting.

Initial recovery can restore saved progress and results without replaying every text fragment. Exact stream replay is a separate feature and does not replace task recovery.

Browser disconnection must not imply task completion or cancellation. If work must continue independently or recover across function failures, use a durable workflow or queue.

Function execution has a finite time limit even while streaming. Background callbacks do not remove that limit. Persist recoverable progress before the execution budget expires.

### 10.6 Prompt caching

Prompt caching reuses model-provider computation for repeated prompt content. It is an optional optimization, not conversation memory, business storage, or an authorization mechanism.

Place stable instructions and tool definitions before changing messages and tool results. Keep prefix content and ordering stable where practical.

The backend must assemble the correct authorized context even when the cache misses. Fact revisions must update that context, and cache keys must not replace ownership checks.

After model selection, configure supported cache controls and measure actual cache usage. Cache lifetime, minimum input length, pricing, and privacy requirements depend on the provider and model.

The Agent SDK, cache configuration, workflow engine, and stream replay storage remain undecided.

## 11. Proposed data model

This model defines necessary relationships. It does not prescribe final table names.

| Entity | Main data and relationships |
| --- | --- |
| User | Account identity and ownership |
| Conversation | Owner, messages, and active project association |
| Project | Owner, title, and target-job association |
| SourceRevision | Owner, source identity, type, text, and prior revision |
| FactRevision | Owner, structured claim, status, and supporting source spans |
| ProjectFact | Association between a project and approved facts |
| TargetJobRevision | Owner, JD text or source reference, and prior revision |
| ChangeProposal | Owner, project, operations, immutable base revisions, complete candidate content, and approval state |
| ResumeVersion | Owner, project, language, content, parent, and approval metadata |
| ResumeEvidence | Association between resume claims and fact revisions |
| Task | Owner, scope, progress, status, error, and retry association |
| TaskStep | Task, sequence, input revision references, result, status, and checkpoint time |
| ToolExecution | Task, tool call ID, validated input, result, status, and idempotency key where needed |
| Export | Owner, resume version, template revision, status, and storage reference |
| AuditEvent | Owner, action, affected IDs, result, and time |

Facts can support multiple projects owned by the same user. Project-specific wording belongs in resume versions, not in shared facts.

References must point to immutable revisions. Deleting referenced content must remove its text as required by the deletion policy.

The interface must show unavailable evidence after deletion. It must not imply that the original source remains accessible.

## 12. Proposed states and task lifecycle

State names below describe behavior rather than final code identifiers.

| Record | States |
| --- | --- |
| Proposal | Pending, approved, rejected, superseded, expired |
| Fact candidate | Proposed, needs clarification, excluded, approved |
| Task | Queued, running, awaiting user, completed, failed, canceled |
| PDF export | Queued, rendering, ready, failed |

Candidate facts remain proposal content until approved. Excluded candidates do not become usable facts.

Task completion means that the task produced its expected result. It does not mean that a pending change received approval.

The system must preserve completed work when a later step fails. A retry must not duplicate approved writes or overwrite a newer version.

If cancellation arrives after a commit, the interface must report that outcome. Cancellation does not silently reverse approved content.

## 13. Privacy and account isolation

Career materials can contain personal data and confidential company information. The product must explain the external model boundary before submission.

The notice must identify the model provider and the categories of text sent. Website storage deletion must not imply deletion from provider systems.

The service must use provider terms and configuration that match its published privacy policy. Unsupported privacy claims must block launch.

Every data access must enforce ownership. This includes conversations, source spans, proposals, tasks, generated content, and downloads.

Required controls include:

- Authentication and ownership enforcement on every relevant route and tool.
- Authenticated route handlers and server-established user scope for Agent calls.
- Server-only storage of model credentials.
- Private export storage or authenticated export delivery.
- Authorization before creating a short-lived download link.
- Encryption in transit.
- Separation of user data in model context and application caches.
- Logging that excludes raw career text, credentials, and full model prompts by default.
- User controls to delete conversations, business content, and the account.

A prompt is an instruction or context sent to a model.

Pasted sources are untrusted data. Instructions inside a JD, glossary, or old resume cannot override tool permissions or approval rules.

The agent does not need arbitrary web access or command execution for the first release. Tools must expose only the operations required by the product.

Retention periods, backup deletion, provider retention, and account recovery require decisions before public launch.

## 14. Reliability and failure behavior

The system must surface actionable errors instead of returning an empty or success-shaped result.

| Failure | Required behavior |
| --- | --- |
| Input exceeds limits | Reject before processing and show the allowed size |
| Important source conflict | Ask for resolution or an explicit exclusion |
| Model timeout or provider limit | Preserve inputs and offer a retry |
| Invalid structured model output | Use a bounded retry, then show a failure without committing |
| Approval revision conflict | Show the current state and request review of a new proposal |
| Duplicate approval request | Return the original commit result without duplicate writes |
| PDF failure | Preserve the approved resume and allow export retry |
| Browser disconnect | Restore recorded task state on reconnect |
| Unauthorized record request | Deny access without revealing another user's content |
| Deleted source | Show that evidence is unavailable and flag affected resumes |

Model retries and agent steps require configured limits. The service must stop and explain when it reaches a limit.

The product must expose task status without presenting a fabricated completion estimate.

## 15. Acceptance criteria

These criteria define observable release behavior. They are not claims about an implemented system.

| ID | Scenario | Pass condition |
| --- | --- | --- |
| AC-01 | New user completes the main workflow | Pasted materials and a JD produce an approved resume, text copy, and PDF |
| AC-02 | User submits a message | The conversation persists, but no source, fact, or project appears without approval |
| AC-03 | Agent proposes business changes | The user sees operations and differences before commit |
| AC-04 | User rejects a proposal | No proposed business changes take effect |
| AC-05 | Approval is sent twice | Exactly one business commit occurs |
| AC-06 | Two sessions approve conflicting changes | The stale proposal fails without partial writes |
| AC-07 | Sources disagree about role dates | The agent asks or excludes the claim before generation |
| AC-08 | Materials lack a metric | The resume adds no invented number |
| AC-09 | Materials describe team delivery | The resume does not claim unsupported personal ownership |
| AC-10 | JD requests an absent skill | The resume does not assert that skill as experience |
| AC-11 | Glossary explains an internal platform | The explanation does not create an unsupported achievement |
| AC-12 | Timeline changes a department but not employer | The resume does not invent a new employer |
| AC-13 | User requests stronger wording | Unsupported factual changes trigger clarification, not silent exaggeration |
| AC-14 | User approves a revision | A new version appears and the previous version remains available |
| AC-15 | User requests English only | No Chinese companion version is automatically generated |
| AC-16 | An approved fact changes | Dependent resumes show a stale warning without automatic rewriting |
| AC-17 | Two users have similar projects | Neither user can read or change the other's records or exports |
| AC-18 | A source contains hostile instructions | No unauthorized tool action or approval bypass occurs |
| AC-19 | PDF contains Chinese and English | Text is selectable, readable, and free from missing glyphs |
| AC-20 | PDF spans several pages | No clipping or overlap occurs, and all approved content remains present |
| AC-21 | The same version is exported twice | Text order, page count, and layout remain stable |
| AC-22 | A task or export fails | The user sees a failure and can retry without losing approved work |
| AC-23 | User deletes source content | The source becomes unavailable, and affected evidence links show its removal |
| AC-24 | User switches target jobs | The next proposal uses the selected job and does not modify another project |
| AC-25 | A candidate remains unapproved | Copy and PDF controls do not treat it as an approved saved version |
| AC-26 | User requests excluded capabilities | The agent explains the current scope and does not pretend to complete them |
| AC-27 | User approves a generated text proposal | The backend commits the exact reviewed candidate without another model generation |
| AC-28 | Generation is incomplete or validation fails | Partial output remains unapproved and cannot be committed |
| AC-29 | User requests edits to a pending proposal | A new proposal requires review, and the previous proposal cannot commit |
| AC-30 | Browser reconnects after generation or approval | The frontend restores persisted task, proposal, and version state from the backend |
| AC-31 | A tool operation is retried after an interrupted response | The retry reuses its committed result or safely resumes without duplicate side effects |
| AC-32 | User approval requires a later request | A new server instance can continue from persisted state without the original process |
| AC-33 | Prompt caching misses or is disabled | Authorization, selected fact revisions, and approval behavior remain unchanged |

## 16. Validation and delivery plan

### 16.1 Evaluation materials

Use synthetic career materials for automated evaluation. Do not copy private career files into a shared test dataset.

The dataset must include:

- A complete career history and matching JD.
- Missing metrics and incomplete dates.
- Conflicting job titles and overlapping timelines.
- Team outcomes with limited personal contributions.
- Internal terms explained in a glossary.
- JD requirements absent from the source materials.
- Chinese, English, and mixed-language sources.
- Long resumes that require multiple PDF pages.
- Sources that contain instructions intended to bypass product rules.

Each dataset case needs expected facts, forbidden claims, and expected questions. The evaluation must test meaning, not keyword presence alone.

### 16.2 Test layers

Use unit tests for revision rules, proposal application, and evidence references. Use integration tests for database transactions and authorization.

Use end-to-end tests for the conversation, approval, resume revision, and PDF workflow.

Test immutable proposal content, incomplete generation, task recovery, tool retries, and continuation from a new server instance. Test cache misses without weakening context or authorization rules.

Use repeated model evaluations for unsupported claims and contribution boundaries. A single successful response does not establish reliability.

PDF tests must extract text and compare layout fixtures. Include visual review for Chinese fonts and page breaks.

Numeric targets for latency, cost, and model quality remain open. No performance claim is approved by this specification.

### 16.3 Proposed implementation sequence

1. Establish authentication, ownership rules, and the service boundary.
2. Implement conversation storage and the approved-change mechanism.
3. Add source proposals, fact extraction, and clarification.
4. Add target-job context and resume candidates with evidence.
5. Add saved revisions, language handling, and stale warnings.
6. Add PDF rendering and authenticated downloads.
7. Run isolation, failure, model-quality, and export tests.
8. Complete launch decisions and publish the required privacy notices.

Each phase depends on the approval and isolation rules. A working chat demo alone does not meet the release scope.

## 17. Open decisions

These items remain unresolved. They must not be presented as user-approved choices.

| Decision | Required before |
| --- | --- |
| Agent framework or custom orchestration | Agent implementation |
| Agent SDK, workflow or queue mechanism, and exact stream replay requirements | Task execution and recovery implementation |
| Model-specific prompt cache configuration | Cache optimization and provider privacy review |
| Model provider, model, and fallback policy | Model integration and privacy notice |
| Hosting platform and deployment regions | Production deployment |
| PDF template, renderer, page size, and font licensing | PDF acceptance testing |
| Input limits, model step limits, and per-user quotas | Hosted testing |
| Pricing and whether the initial service is paid | Public availability |
| Data retention, deletion timing, and backup expiry | Public launch |
| Provider retention and use of submitted data | Any real-user submission |
| Latency, cost, and model-quality release thresholds | Release approval |
| UI language and localization scope | User-facing interface release |
| Behavior for sensitive source passages beyond user-marked restrictions | Privacy review before launch |

## 18. First-release definition of done

The release is complete when a signed-in user can complete the main workflow without an IDE or manual file management.

Every business change requires an observable approval action. Every generated factual claim traces to approved facts.

The release must pass the acceptance criteria and the agreed model-quality thresholds. Account isolation, privacy notices, deletion behavior, and PDF layout must receive release evidence.

Unresolved launch decisions block public release. Features outside the first-release scope do not block it.