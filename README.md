FlowChart without Any Tools

```mermaid
flowchart TD

A[User Signup] --> B[User Selects Cluster + Application]

B --> C[Admin/Dev Registers Integration Config<br/>Base URL + Auth Type + Required Scopes]

C --> D[Auth Setup in Our System<br/>OAuth or API Key Stored Securely]

D --> E[Connection Test<br/>Call Minimal Endpoint]

E --> F[Define Data Extraction Mapping<br/>Select Required Entities + Fields]

F --> G[Agent Applies Rulebook<br/>Select KPI Templates]

G --> H[Generate DataPlan<br/>Resources + Joins + Aggregations + Schedule]

H --> I[Generate DashboardSpec<br/>Widgets + Layout + Bindings]

I --> J[Draft Dashboard Shown to User]

J --> K[Persist Plan<br/>IntegrationConfig + DataPlan + DashboardSpec]

K --> L[Initial Backfill Sync<br/>Worker Calls Vendor APIs Directly]

L --> M[Store Raw Data in Firestore]
M --> N[Compute Aggregates]
N --> O[Store Widget Data]

O --> P[Dashboard Live<br/>Reads Firestore Only]

P --> Q{Refresh Trigger?}
Q -->|Scheduled| L
Q -->|Manual| L
```

Flow Chart with Merge/Unified.to + PolyAPI

```mermaid
flowchart TD

A[User Signup] --> B[User Selects Cluster + Application]

B --> C[Check Supported Apps Registry]

C --> D{Supported by Connector?}

%% CONNECTOR PATH
D -->|Yes| E[Connector OAuth Link<br/>Merge / Unified Hosted Auth]

E --> F[Receive Linked Account Token]

F --> G[Connection Test via Connector]

G --> H[Agent Applies Rulebook<br/>Using Unified Schema]

H --> I[Generate DataPlan<br/>Using Connector Resources]

I --> J[Generate DashboardSpec]

J --> K[Draft Dashboard]

K --> L[Persist Plan]

L --> M[Initial Backfill Sync<br/>Worker Pulls via Connector]

M --> N[Store Raw Data in Firestore]
N --> O[Compute Aggregates]
O --> P[Store Widget Data]

P --> Q[Dashboard Live]

%% FALLBACK PATH
D -->|No| R[Discover API Docs + Auth Setup]

R --> S{OpenAPI Spec Available?}

S -->|Yes| T[Generate Connector via PolyAPI]
S -->|No| U[Manual API Wrapper]

T --> V[Connection Test]
U --> V

V --> W[Agent Applies Rulebook<br/>From Extracted Schema]

W --> I
```
