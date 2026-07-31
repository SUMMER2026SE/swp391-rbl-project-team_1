const fs = require('fs');
const path = 'C:\\Users\\Heota\\.gemini\\antigravity-ide\\brain\\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\\mermaid_diagrams.md';

let content = fs.readFileSync(path, 'utf8');

const newUC = 
---

## UC 1.5 — Reset Password

### Class Diagram
\\\
classDiagram
    class ForgotPasswordServlet {
        +doGet(request, response)
        +doPost(request, response)
    }
    class ForgotPasswordModel {
        +sendResetEmail(email: String) boolean
        +resetPassword(token: String, newPassword: String) boolean
    }
    class PasswordResetDAO {
        +dbConnection: DBConnection
        +createResetToken(email: String, token: String, expiresAt: DateTime) boolean
        +verifyToken(token: String) PasswordReset
    }
    class UserDAO {
        +dbConnection: DBConnection
        +updatePassword(email: String, newPassword: String) boolean
    }
    class DBConnection {
        +instance: DBConnection
        +openConnection() Connection
        +getInstance() DBConnection
    }
    class PasswordReset {
        -id: int
        -email: String
        -token: String
        -expiresAt: DateTime
        +PasswordReset()
        +getter()
        +setter()
    }
    ForgotPasswordServlet ..> ForgotPasswordModel
    ForgotPasswordModel ..> PasswordResetDAO
    ForgotPasswordModel ..> UserDAO
    PasswordResetDAO ..> PasswordReset
    PasswordResetDAO --> DBConnection
    UserDAO --> DBConnection
\\\

### Sequence Diagram
\\\
sequenceDiagram
    actor Guest as Guest
    participant Browser
    participant Servlet as ForgotPasswordServlet
    participant Model as ForgotPasswordModel
    participant PR_DAO as PasswordResetDAO
    participant User_DAO as UserDAO
    participant DB as Database

    Guest->>Browser: 1: Click "Forgot Password" & Enter email
    Browser->>Servlet: 2: POST /forgot-password (email)
    Servlet->>Model: 3: sendResetEmail(email)
    Model->>PR_DAO: 4: createResetToken(email, token, expiresAt)
    PR_DAO->>DB: 5: INSERT INTO PasswordReset (email, token...)
    DB-->>PR_DAO: 6: return success
    PR_DAO-->>Model: 7: return success
    Model->>Model: 8: sendEmail(email, token)
    Model-->>Servlet: 9: return success
    Servlet-->>Browser: 10: render "Check your email" message
    Guest->>Browser: 11: Click link in email
    Browser->>Servlet: 12: GET /reset-password?token=?
    Servlet->>Model: 13: verifyToken(token)
    Model->>PR_DAO: 14: verifyToken(token)
    PR_DAO->>DB: 15: SELECT * FROM PasswordReset WHERE token=?
    DB-->>PR_DAO: 16: return token record
    PR_DAO-->>Model: 17: return token valid?
    alt Token valid
        Model-->>Servlet: 18.1: return true
        Servlet-->>Browser: 19.1: render new password form
        Guest->>Browser: 20: Enter new password
        Browser->>Servlet: 21: POST /reset-password (newPassword, token)
        Servlet->>Model: 22: resetPassword(token, newPassword)
        Model->>User_DAO: 23: updatePassword(email, newPassword)
        User_DAO->>DB: 24: UPDATE User SET password=? WHERE email=?
        DB-->>User_DAO: 25: return success
        User_DAO-->>Model: 26: return result
        Model-->>Servlet: 27: return result
        Servlet-->>Browser: 28: render "Password updated successfully"
    else Token invalid or expired
        Model-->>Servlet: 18.2: return false
        Servlet-->>Browser: 19.2: render "Link expired" error
    end
\\\
;

content = content + newUC;

fs.writeFileSync(path, content, 'utf8');

console.log('Done appending Reset Password UC.');
