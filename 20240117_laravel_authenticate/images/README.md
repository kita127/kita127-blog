```mermaid
sequenceDiagram
    Client->>+Server: GET /login(ログイン画面取得)
    Server-->>-Client: login画面
    Client->>+Server: POST /login(認証)
    Server-->>-Client: 302 Location /
    Client->>+Server: GET /(トップ画面取得)
    Server-->>-Client: トップ画面
    Client->>+Client: SPA
```
