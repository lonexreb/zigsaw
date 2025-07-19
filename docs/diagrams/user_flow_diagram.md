# User Flow Diagrams

## 1. User Onboarding and Registration Flow

```mermaid
flowchart TD
    A[User visits website] --> B{User has account?}
    B -->|No| C[Click Register]
    B -->|Yes| D[Click Login]
    
    C --> E[Fill registration form]
    E --> F[Submit form]
    F --> G{Registration valid?}
    G -->|No| H[Show validation errors]
    H --> E
    G -->|Yes| I[Create account]
    I --> J[Send verification email]
    J --> K[Show verification message]
    K --> L[User checks email]
    L --> M[Click verification link]
    M --> N[Account verified]
    N --> O[Redirect to dashboard]
    
    D --> P[Enter credentials]
    P --> Q[Submit login]
    Q --> R{Login valid?}
    R -->|No| S[Show error message]
    S --> P
    R -->|Yes| T[Create session]
    T --> U[Redirect to dashboard]
    
    O --> V[Welcome tour]
    U --> V
    V --> W[User onboarded]
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef error fill:#ffebee
    
    class A,W startEnd
    class C,E,F,I,J,K,L,M,N,O,D,P,Q,T,U,V process
    class B,G,R decision
    class H,S error
```

## 2. Workflow Creation and Management Flow

```mermaid
flowchart TD
    A[User on dashboard] --> B[Click Create Workflow]
    B --> C[Enter workflow name]
    C --> D[Choose workflow template]
    D --> E{Use template?}
    E -->|Yes| F[Load template]
    E -->|No| G[Start with blank canvas]
    
    F --> H[Workflow canvas loaded]
    G --> H
    
    H --> I[Add nodes from palette]
    I --> J[Configure node settings]
    J --> K[Connect nodes]
    K --> L{Add more nodes?}
    L -->|Yes| I
    L -->|No| M[Review workflow]
    
    M --> N{Workflow valid?}
    N -->|No| O[Show validation errors]
    O --> P[Fix errors]
    P --> M
    N -->|Yes| Q[Save workflow]
    Q --> R[Test workflow]
    R --> S{Test successful?}
    S -->|No| T[Debug issues]
    T --> U[Modify workflow]
    U --> M
    S -->|Yes| V[Publish workflow]
    V --> W[Workflow ready]
    
    H --> X[Load existing workflow]
    X --> Y[Edit workflow]
    Y --> Z[Save changes]
    Z --> AA[Update workflow]
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef error fill:#ffebee
    
    class A,W startEnd
    class B,C,D,F,G,H,I,J,K,Q,R,V,X,Y,Z,AA process
    class E,L,N,S decision
    class O,T,U,P error
```

## 3. Node Configuration and Integration Flow

```mermaid
flowchart TD
    A[User selects node] --> B[Open node configuration]
    B --> C{Node type?}
    C -->|AI Node| D[Configure AI settings]
    C -->|Gmail Node| E[Configure Gmail integration]
    C -->|Calendar Node| F[Configure calendar integration]
    C -->|Custom Node| G[Configure custom settings]
    
    D --> H[Select AI provider]
    H --> I[Enter API key]
    I --> J[Set model parameters]
    J --> K[Configure prompts]
    K --> L[Test AI connection]
    
    E --> M[Start OAuth flow]
    M --> N[Authorize with Google]
    N --> O[Grant permissions]
    O --> P[OAuth callback]
    P --> Q[Test Gmail connection]
    
    F --> R[Start Calendar OAuth]
    R --> S[Authorize calendar access]
    S --> T[Grant calendar permissions]
    T --> U[OAuth callback]
    U --> V[Test calendar connection]
    
    G --> W[Enter custom configuration]
    W --> X[Validate settings]
    X --> Y[Test custom connection]
    
    L --> Z{Test successful?}
    Q --> Z
    V --> Z
    Y --> Z
    Z -->|No| AA[Show error details]
    AA --> BB[Fix configuration]
    BB --> CC[Retry test]
    CC --> Z
    Z -->|Yes| DD[Save configuration]
    DD --> EE[Configuration complete]
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef error fill:#ffebee
    classDef oauth fill:#e3f2fd
    
    class A,EE startEnd
    class B,D,H,I,J,K,L,W,X,Y,DD process
    class C,Z decision
    class AA,BB,CC error
    class M,N,O,P,Q,R,S,T,U,V oauth
```

## 4. Workflow Execution and Monitoring Flow

```mermaid
flowchart TD
    A[User clicks Execute] --> B[Validate workflow]
    B --> C{Workflow valid?}
    C -->|No| D[Show validation errors]
    D --> E[Fix workflow issues]
    E --> B
    C -->|Yes| F[Start execution]
    F --> G[Initialize execution context]
    G --> H[Execute first node]
    
    H --> I[Process node]
    I --> J{Node execution successful?}
    J -->|No| K[Handle node error]
    K --> L{Retry node?}
    L -->|Yes| M[Retry execution]
    M --> I
    L -->|No| N[Mark execution failed]
    N --> O[Show error details]
    O --> P[Execution complete]
    
    J -->|Yes| Q[Save node result]
    Q --> R[Update progress]
    R --> S{More nodes?}
    S -->|Yes| T[Execute next node]
    T --> I
    S -->|No| U[All nodes complete]
    U --> V[Generate final output]
    V --> W[Save execution results]
    W --> X[Notify user]
    X --> Y[Show results]
    Y --> P
    
    P --> Z{View results?}
    Z -->|Yes| AA[Open results viewer]
    AA --> BB[Display node outputs]
    BB --> CC[Show execution timeline]
    CC --> DD[Export results]
    Z -->|No| EE[Return to dashboard]
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef error fill:#ffebee
    classDef success fill:#e8f5e8
    
    class A,P,EE startEnd
    class B,F,G,H,I,Q,R,T,U,V,W,X,Y,AA,BB,CC,DD process
    class C,J,L,S,Z decision
    class D,E,K,M,N,O error
    class U,V,W,X,Y success
```

## 5. API Key and Settings Management Flow

```mermaid
flowchart TD
    A[User opens settings] --> B[Navigate to API Keys]
    B --> C{Has API keys?}
    C -->|No| D[Show empty state]
    C -->|Yes| E[Display API keys list]
    
    D --> F[Click Add API Key]
    E --> G[Choose action]
    G --> H[Add new key]
    G --> I[Edit existing key]
    G --> J[Delete key]
    
    F --> K[Select provider]
    H --> K
    K --> L[Enter API key]
    L --> M[Enter key name]
    M --> N[Test API key]
    N --> O{Test successful?}
    O -->|No| P[Show error message]
    P --> Q[Check key validity]
    Q --> L
    O -->|Yes| R[Save API key]
    R --> S[Key saved successfully]
    
    I --> T[Load key details]
    T --> U[Edit key information]
    U --> V[Update key]
    V --> W[Key updated]
    
    J --> X[Confirm deletion]
    X --> Y{Confirm delete?}
    Y -->|No| E
    Y -->|Yes| Z[Delete key]
    Z --> AA[Key deleted]
    
    S --> E
    W --> E
    AA --> E
    
    E --> BB[Configure usage limits]
    BB --> CC[Set rate limits]
    CC --> DD[Save settings]
    DD --> EE[Settings saved]
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef error fill:#ffebee
    classDef success fill:#e8f5e8
    
    class A,EE startEnd
    class B,D,E,F,G,H,K,L,M,N,R,T,U,V,X,Z,BB,CC,DD process
    class C,O,Y decision
    class P,Q error
    class S,W,AA,EE success
```

## 6. Collaboration and Sharing Flow

```mermaid
flowchart TD
    A[User selects workflow] --> B[Click Share button]
    B --> C[Open sharing dialog]
    C --> D[Choose sharing option]
    D --> E{Sharing type?}
    E -->|Public| F[Generate public link]
    E -->|Team| G[Select team members]
    E -->|Custom| H[Enter email addresses]
    
    F --> I[Set public permissions]
    I --> J[Generate shareable link]
    J --> K[Copy link]
    K --> L[Share link externally]
    
    G --> M[Choose team members]
    M --> N[Set permissions]
    N --> O[Send invitations]
    O --> P[Team members notified]
    
    H --> Q[Enter collaborator emails]
    Q --> R[Set individual permissions]
    R --> S[Send invitations]
    S --> T[Collaborators notified]
    
    L --> U[External user accesses]
    U --> V{Has account?}
    V -->|No| W[Create guest account]
    V -->|Yes| X[Direct access]
    W --> X
    X --> Y[View shared workflow]
    Y --> Z{Can edit?}
    Z -->|Yes| AA[Edit workflow]
    Z -->|No| BB[View only]
    
    P --> CC[Team member accepts]
    T --> CC
    CC --> DD[Access granted]
    DD --> EE[Collaborate on workflow]
    
    AA --> FF[Make changes]
    FF --> GG[Save changes]
    GG --> HH[Notify collaborators]
    HH --> II[Changes synchronized]
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef sharing fill:#e3f2fd
    classDef collaboration fill:#f3e5f5
    
    class A,II startEnd
    class B,C,D,F,I,J,K,L,G,M,N,O,H,Q,R,S,U,W,X,Y,CC,DD,FF,GG,HH process
    class E,V,Z decision
    class F,I,J,K,L,O,P,S,T sharing
    class AA,BB,EE,FF,GG,HH,II collaboration
```

## 7. Error Handling and Recovery Flow

```mermaid
flowchart TD
    A[User encounters error] --> B{Error type?}
    B -->|Network Error| C[Show network error]
    B -->|Validation Error| D[Show validation messages]
    B -->|Auth Error| E[Show authentication error]
    B -->|System Error| F[Show system error]
    
    C --> G[Retry button]
    G --> H[Attempt retry]
    H --> I{Retry successful?}
    I -->|Yes| J[Continue operation]
    I -->|No| K[Show persistent error]
    K --> L[Contact support]
    
    D --> M[Highlight invalid fields]
    M --> N[Show field-specific errors]
    N --> O[User fixes validation]
    O --> P[Revalidate input]
    P --> Q{Validation passed?}
    Q -->|No| M
    Q -->|Yes| R[Continue operation]
    
    E --> S[Clear authentication]
    S --> T[Redirect to login]
    T --> U[User re-authenticates]
    U --> V[Resume original operation]
    
    F --> W[Log error details]
    W --> X[Show user-friendly message]
    X --> Y[Provide error reference]
    Y --> Z[Options for user]
    Z --> AA[Retry operation]
    Z --> BB[Report bug]
    Z --> CC[Contact support]
    
    AA --> H
    BB --> DD[Open bug report form]
    DD --> EE[Submit bug report]
    EE --> FF[Bug reported]
    
    CC --> GG[Open support chat]
    GG --> HH[Connect with support]
    HH --> II[Get assistance]
    
    J --> JJ[Operation complete]
    R --> JJ
    V --> JJ
    FF --> JJ
    II --> JJ
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef error fill:#ffebee
    classDef success fill:#e8f5e8
    
    class A,JJ startEnd
    class C,D,E,F,G,H,M,N,O,P,S,T,U,V,W,X,Y,Z,AA,BB,CC,DD,EE,GG,HH,II process
    class B,I,Q decision
    class C,D,E,F,K,L,M,N,W,X,Y error
    class J,R,V,FF,II,JJ success
```

## 8. Mobile and Responsive Experience Flow

```mermaid
flowchart TD
    A[User opens app] --> B{Device type?}
    B -->|Mobile| C[Load mobile layout]
    B -->|Tablet| D[Load tablet layout]
    B -->|Desktop| E[Load desktop layout]
    
    C --> F[Optimize for touch]
    F --> G[Collapse navigation]
    G --> H[Simplify workflow canvas]
    H --> I[Enable gesture controls]
    
    D --> J[Hybrid touch/mouse]
    J --> K[Responsive navigation]
    K --> L[Scalable workflow canvas]
    
    E --> M[Full feature set]
    M --> N[Complete navigation]
    N --> O[Full workflow canvas]
    
    I --> P[Mobile workflow creation]
    P --> Q[Swipe to add nodes]
    Q --> R[Tap to configure]
    R --> S[Pinch to zoom]
    S --> T[Scroll to navigate]
    
    L --> U[Tablet workflow creation]
    U --> V[Drag and drop nodes]
    V --> W[Touch to configure]
    W --> X[Multi-touch gestures]
    
    O --> Y[Desktop workflow creation]
    Y --> Z[Full drag and drop]
    Z --> AA[Keyboard shortcuts]
    AA --> BB[Context menus]
    
    T --> CC[Execute workflow]
    X --> CC
    BB --> CC
    CC --> DD[Monitor execution]
    DD --> EE{Device orientation?}
    EE -->|Portrait| FF[Vertical layout]
    EE -->|Landscape| GG[Horizontal layout]
    
    FF --> HH[Stack node results]
    GG --> II[Side-by-side results]
    HH --> JJ[Scroll to view all]
    II --> JJ
    JJ --> KK[Execution complete]
    
    classDef startEnd fill:#e8f5e8
    classDef process fill:#fff3e0
    classDef decision fill:#fce4ec
    classDef mobile fill:#e3f2fd
    classDef tablet fill:#f3e5f5
    classDef desktop fill:#e8f5e8
    
    class A,KK startEnd
    class F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,BB,CC,DD,FF,GG,HH,II,JJ process
    class B,EE decision
    class C,F,G,H,I,P,Q,R,S,T mobile
    class D,J,K,L,U,V,W,X tablet
    class E,M,N,O,Y,Z,AA,BB desktop
```

These user flow diagrams demonstrate:

1. **Complete user journeys** from start to finish
2. **Error handling and recovery** at each step
3. **Multi-device experience** considerations
4. **Collaboration and sharing** workflows
5. **Integration setup** processes
6. **Settings management** flows
7. **Real-time execution** monitoring
8. **Responsive design** considerations

The flows show how users interact with the system across different scenarios and devices, ensuring a smooth and intuitive experience throughout their journey.