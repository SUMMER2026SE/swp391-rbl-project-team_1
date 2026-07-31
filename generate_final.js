const fs = require('fs');
const path = 'C:\\Users\\Heota\\.gemini\\antigravity-ide\\brain\\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\\mermaid_diagrams.md';

const content = # Mermaid.ai Diagrams — Tất cả Use Cases
> Cú pháp chuẩn Mermaid. Có đầy đủ Hộp dọc (Lifelines).

---

## UC 1.1 — Register

### Class Diagram
\\\mermaid
classDiagram
    class RegisterServlet {
        -serialVersionUID: long
        -logger: Logger
        +doGet(request, response)
        +doPost(request, response)
    }
    class RegisterModel {
        +getMd5(password: String) String
        +registerUser(user: User) boolean
    }
    class UserDAO {
        +dbConnection: DBConnection
        +checkExistEmail(email: String) boolean
        +addUserByRegister(user: User) boolean
    }
    class DBConnection {
        +instance: DBConnection
        +openConnection() Connection
        +getInstance() DBConnection
    }
    class User {
        -userId: int
        -email: String
        -password: String
        -fullName: String
        -role: String
        -isLocked: Boolean
        +User()
        +getter()
        +setter()
    }
    class Configuration {
        <<interface>>
        +driverName: String
        +url: String
        +pass: String
        +templatePath: String
    }
    RegisterServlet ..> RegisterModel
    RegisterModel ..> UserDAO
    UserDAO ..> User
    UserDAO --> DBConnection
    Configuration <|.. DBConnection
\\\

### Sequence Diagram
\\\mermaid
sequenceDiagram
    actor Guest as Guest
    participant Browser
    participant Servlet as RegisterServlet
    participant Model as RegisterModel
    participant DAO as UserDAO
    participant DB as Database

    Guest->>Browser: 1: Click "Register" button
    Browser->>Browser: Check validator
    Browser->>Servlet: 2: Send request
    activate Servlet
    Servlet->>Model: 3: registerUser(user)
    activate Model
    Model->>Model: 4: getMd5(password)
    Model->>DAO: 5: checkExistEmail(email)
    activate DAO
    DAO->>DB: 6: executeQuery()
    activate DB
    DB-->>DAO: 7: return result
    deactivate DB
    DAO-->>Model: 8: return exists?
    deactivate DAO
    Model->>DAO: 9: addUserByRegister(user)
    activate DAO
    DAO->>DB: 10: executeUpdate()
    activate DB
    DB-->>DAO: 11: return result
    deactivate DB
    DAO-->>Model: 12: return result
    deactivate DAO
    Model-->>Servlet: 13: return result
    deactivate Model
    alt Create successfully
        Servlet-->>Browser: 14.1: render successfully
    else Create unsuccessfully
        Servlet-->>Browser: 14.2: render error page
    end
    deactivate Servlet
\\\

---

## UC 1.2 — OTP Verification & Onboarding

### Class Diagram
\\\mermaid
classDiagram
    class OnboardingServlet {
        +doGet(request, response)
        +doPost(request, response)
    }
    class OnboardingModel {
        +verifyOTP(email: String, code: String) boolean
        +saveHealthInfo(userId: String, data: User) boolean
    }
    class OTPDao {
        +dbConnection: DBConnection
        +createOTP(email: String, code: String) boolean
        +verifyOTP(email: String, code: String) boolean
    }
    class UserDAO {
        +dbConnection: DBConnection
        +updateHealthInfo(user: User) boolean
    }
    class DBConnection {
        +instance: DBConnection
        +openConnection() Connection
        +getInstance() DBConnection
    }
    class OTP {
        -id: int
        -email: String
        -code: String
        -verified: Boolean
        -expiresAt: DateTime
        +OTP()
        +getter()
        +setter()
    }
    OnboardingServlet ..> OnboardingModel
    OnboardingModel ..> OTPDao
    OnboardingModel ..> UserDAO
    OTPDao ..> OTP
    OTPDao --> DBConnection
    UserDAO --> DBConnection
\\\

### Sequence Diagram
\\\mermaid
sequenceDiagram
    actor Patient as Patient
    participant Browser
    participant Servlet as OnboardingServlet
    participant Model as OnboardingModel
    participant DAO as OTPDao
    participant DB as Database

    Patient->>Browser: 1: Enter OTP code
    Browser->>Servlet: 2: POST verifyOTP(email, code)
    activate Servlet
    Servlet->>Model: 3: verifyOTP(email, code)
    activate Model
    Model->>DAO: 4: findOTP(email, code)
    activate DAO
    DAO->>DB: 5: SELECT OTP WHERE email=? AND code=?
    activate DB
    DB-->>DAO: 6: return OTP record
    deactivate DB
    DAO-->>Model: 7: return verified?
    deactivate DAO
    alt OTP valid
        Patient->>Browser: 8: Fill health survey form
        Browser->>Servlet: 9: POST saveHealthInfo(data)
        Servlet->>Model: 10: saveHealthInfo(userId, data)
        Model->>DAO: 11: updateHealthInfo(user)
        activate DAO
        DAO->>DB: 12: UPDATE User SET bloodType=?, allergies=?
        activate DB
        DB-->>DAO: 13: return success
        deactivate DB
        DAO-->>Model: 14: return result
        deactivate DAO
        Model-->>Servlet: 15: return result
        Servlet-->>Browser: 16: redirect to home
    else OTP invalid or expired
        Model-->>Servlet: 8.2: return false
        Servlet-->>Browser: 9.2: render error message
    end
    deactivate Model
    deactivate Servlet
\\\

---

## UC 1.3 — Login

### Class Diagram
\\\mermaid
classDiagram
    class LoginServlet {
        -serialVersionUID: long
        +doGet(request, response)
        +doPost(request, response)
    }
    class LoginModel {
        +authenticate(email: String, password: String) User
        +generateToken(user: User) String
    }
    class UserDAO {
        +dbConnection: DBConnection
        +getUserByEmail(email: String) User
    }
    class DBConnection {
        +instance: DBConnection
        +openConnection() Connection
        +getInstance() DBConnection
    }
    class User {
        -id: String
        -email: String
        -password: String
        -role: String
        -isLocked: Boolean
        +User()
        +getter()
        +setter()
    }
    LoginServlet ..> LoginModel
    LoginModel ..> UserDAO
    UserDAO ..> User
    UserDAO --> DBConnection
\\\

### Sequence Diagram
\\\mermaid
sequenceDiagram
    actor User as User
    participant Browser
    participant Servlet as LoginServlet
    participant Model as LoginModel
    participant DAO as UserDAO
    participant DB as Database

    User->>Browser: 1: Enter email & password
    Browser->>Servlet: 2: POST login(email, password)
    activate Servlet
    Servlet->>Model: 3: authenticate(email, password)
    activate Model
    Model->>DAO: 4: getUserByEmail(email)
    activate DAO
    DAO->>DB: 5: SELECT * FROM User WHERE email=?
    activate DB
    DB-->>DAO: 6: return User record
    deactivate DB
    DAO-->>Model: 7: return User object
    deactivate DAO
    Model->>Model: 8: verifyPassword(password, hash)
    alt Credentials valid
        Model->>Model: 9: generateToken(user)
        Model-->>Servlet: 10: return JWT token
        Servlet-->>Browser: 11: set cookie & redirect to dashboard
    else Invalid credentials or locked
        Model-->>Servlet: 10.2: return null
        Servlet-->>Browser: 11.2: render error message
    end
    deactivate Model
    deactivate Servlet
\\\

---

## UC 1.4 — View & Update Profile

### Class Diagram
\\\mermaid
classDiagram
    class ProfileServlet {
        +doGet(request, response)
        +doPost(request, response)
    }
    class ProfileModel {
        +getProfile(userId: String) User
        +updateProfile(user: User) boolean
    }
    class UserDAO {
        +dbConnection: DBConnection
        +getUserById(userId: String) User
        +updateProfile(user: User) boolean
    }
    class DBConnection {
        +instance: DBConnection
        +openConnection() Connection
        +getInstance() DBConnection
    }
    class User {
        -id: String
        -fullName: String
        -avatar: String
        -gender: String
        -address: String
        -dateOfBirth: DateTime
        +User()
        +getter()
        +setter()
    }
    ProfileServlet ..> ProfileModel
    ProfileModel ..> UserDAO
    UserDAO ..> User
    UserDAO --> DBConnection
\\\

### Sequence Diagram
\\\mermaid
sequenceDiagram
    actor Patient as Patient
    participant Browser
    participant Servlet as ProfileServlet
    participant Model as ProfileModel
    participant DAO as UserDAO
    participant DB as Database

    Patient->>Browser: 1: Navigate to Profile page
    Browser->>Servlet: 2: GET /profile
    activate Servlet
    Servlet->>Model: 3: getProfile(userId)
    activate Model
    Model->>DAO: 4: getUserById(userId)
    activate DAO
    DAO->>DB: 5: SELECT * FROM User WHERE id=?
    activate DB
    DB-->>DAO: 6: return user data
    deactivate DB
    DAO-->>Model: 7: return User object
    deactivate DAO
    Model-->>Servlet: 8: return profile data
    deactivate Model
    Servlet-->>Browser: 9: render profile page
    deactivate Servlet
    Patient->>Browser: 10: Edit fields & click Save
    Browser->>Servlet: 11: POST updateProfile(data)
    activate Servlet
    Servlet->>Model: 12: updateProfile(user)
    activate Model
    Model->>DAO: 13: updateProfile(user)
    activate DAO
    DAO->>DB: 14: UPDATE User SET fullName=?, avatar=?...
    activate DB
    DB-->>DAO: 15: return success
    deactivate DB
    DAO-->>Model: 16: return result
    deactivate DAO
    Model-->>Servlet: 17: return result
    deactivate Model
    Servlet-->>Browser: 18: render updated profile
    deactivate Servlet
\\\

---

## UC 1.5 — Reset Password

### Class Diagram
\\\mermaid
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
\\\mermaid
sequenceDiagram
    actor Guest as Guest
    participant Browser
    participant Servlet as ForgotPasswordServlet
    participant Model as ForgotPasswordModel
    participant PR_DAO as PasswordResetDAO
    participant User_DAO as UserDAO
    participant DB as Database

    Guest->>Browser: 1: Click "Forgot Password" & Enter email
    Browser->>Servlet: 2: POST /forgot-password
    activate Servlet
    Servlet->>Model: 3: sendResetEmail(email)
    activate Model
    Model->>PR_DAO: 4: createResetToken(email, token, expiresAt)
    activate PR_DAO
    PR_DAO->>DB: 5: INSERT INTO PasswordReset
    activate DB
    DB-->>PR_DAO: 6: return success
    deactivate DB
    PR_DAO-->>Model: 7: return success
    deactivate PR_DAO
    Model->>Model: 8: sendEmail(email, token)
    Model-->>Servlet: 9: return success
    deactivate Model
    Servlet-->>Browser: 10: render "Check your email"
    deactivate Servlet
    Guest->>Browser: 11: Click link in email
    Browser->>Servlet: 12: GET /reset-password
    activate Servlet
    Servlet->>Model: 13: verifyToken(token)
    activate Model
    Model->>PR_DAO: 14: verifyToken(token)
    activate PR_DAO
    PR_DAO->>DB: 15: SELECT * FROM PasswordReset WHERE token=?
    activate DB
    DB-->>PR_DAO: 16: return token record
    deactivate DB
    PR_DAO-->>Model: 17: return token valid?
    deactivate PR_DAO
    alt Token valid
        Model-->>Servlet: 18.1: return true
        Servlet-->>Browser: 19.1: render new password form
        Guest->>Browser: 20: Enter new password
        Browser->>Servlet: 21: POST /reset-password
        Servlet->>Model: 22: resetPassword(token, newPassword)
        Model->>User_DAO: 23: updatePassword(email, newPassword)
        activate User_DAO
        User_DAO->>DB: 24: UPDATE User SET password=?
        activate DB
        DB-->>User_DAO: 25: return success
        deactivate DB
        User_DAO-->>Model: 26: return result
        deactivate User_DAO
        Model-->>Servlet: 27: return result
        Servlet-->>Browser: 28: render "Password updated successfully"
    else Token invalid or expired
        Model-->>Servlet: 18.2: return false
        Servlet-->>Browser: 19.2: render "Link expired" error
    end
    deactivate Model
    deactivate Servlet
\\\

---

## UC 2.1 — Search Doctor

### Class Diagram
\\\mermaid
classDiagram
    class SearchDoctorServlet {
        +doGet(request, response)
    }
    class SearchDoctorModel {
        +searchDoctors(keyword: String) List~DoctorDTO~
        +filterBySpecialty(specialtyId: String) List~DoctorDTO~
    }
    class DoctorDAO {
        +dbConnection: DBConnection
        +searchDoctors(keyword: String) List~DoctorDTO~
        +getBySpecialty(specialtyId: String) List~DoctorDTO~
    }
    class DBConnection {
        +instance: DBConnection
        +openConnection() Connection
        +getInstance() DBConnection
    }
    class Doctor {
        -id: String
        -name: String
        -experience: int
        -price: int
        -status: String
        -specialtyId: String
        +Doctor()
        +getter()
        +setter()
    }
    SearchDoctorServlet ..> SearchDoctorModel
    SearchDoctorModel ..> DoctorDAO
    DoctorDAO ..> Doctor
    DoctorDAO --> DBConnection
\\\

### Sequence Diagram
\\\mermaid
sequenceDiagram
    actor Patient as Patient
    participant Browser
    participant Servlet as SearchDoctorServlet
    participant Model as SearchDoctorModel
    participant DAO as DoctorDAO
    participant DB as Database

    Patient->>Browser: 1: Enter keyword in search bar
    Browser->>Servlet: 2: GET /doctors?keyword=?
    activate Servlet
    Servlet->>Model: 3: searchDoctors(keyword)
    activate Model
    Model->>DAO: 4: searchDoctors(keyword)
    activate DAO
    DAO->>DB: 5: SELECT d.* FROM Doctor d WHERE name ILIKE ?
    activate DB
    DB-->>DAO: 6: return doctor list
    deactivate DB
    DAO-->>Model: 7: return List~DoctorDTO~
    deactivate DAO
    Model-->>Servlet: 8: return doctor list
    deactivate Model
    Servlet-->>Browser: 9: render search results
    deactivate Servlet
\\\

---

## UC 2.3 — Book Appointment

### Class Diagram
\\\mermaid
classDiagram
    class BookAppointmentServlet {
        +doGet(request, response)
        +doPost(request, response)
    }
    class BookAppointmentModel {
        +getAvailableSlots(doctorId: String) List~DoctorSchedule~
        +bookAppointment(req: BookingRequest) String
    }
    class AppointmentDAO {
        +dbConnection: DBConnection
        +createAppointment(appt: Appointment) String
    }
    class ScheduleDAO {
        +dbConnection: DBConnection
        +getAvailableSlots(doctorId: String) List~DoctorSchedule~
    }
    class DBConnection {
        +instance: DBConnection
        +openConnection() Connection
        +getInstance() DBConnection
    }
    class Appointment {
        -id: String
        -userId: String
        -doctorId: String
        -appointmentDate: DateTime
        -status: String
        -amount: int
        +Appointment()
        +getter()
        +setter()
    }
    BookAppointmentServlet ..> BookAppointmentModel
    BookAppointmentModel ..> AppointmentDAO
    BookAppointmentModel ..> ScheduleDAO
    AppointmentDAO ..> Appointment
    AppointmentDAO --> DBConnection
    ScheduleDAO --> DBConnection
\\\

### Sequence Diagram
\\\mermaid
sequenceDiagram
    actor Patient as Patient
    participant Browser
    participant Servlet as BookAppointmentServlet
    participant Model as BookAppointmentModel
    participant ScDAO as ScheduleDAO
    participant ApptDAO as AppointmentDAO
    participant DB as Database

    Patient->>Browser: 1: Select doctor & date
    Browser->>Servlet: 2: GET available slots
    activate Servlet
    Servlet->>Model: 3: getAvailableSlots(doctorId)
    activate Model
    Model->>ScDAO: 4: getAvailableSlots(doctorId)
    activate ScDAO
    ScDAO->>DB: 5: SELECT * FROM DoctorSchedule WHERE isAvailable=true
    activate DB
    DB-->>ScDAO: 6: return slots
    deactivate DB
    ScDAO-->>Model: 7: return slot list
    deactivate ScDAO
    Model-->>Servlet: 8: return available slots
    deactivate Model
    Servlet-->>Browser: 9: render time slot picker
    deactivate Servlet
    Patient->>Browser: 10: Confirm booking
    Browser->>Servlet: 11: POST bookAppointment(data)
    activate Servlet
    Servlet->>Model: 12: bookAppointment(req)
    activate Model
    Model->>ApptDAO: 13: createAppointment(appt)
    activate ApptDAO
    ApptDAO->>DB: 14: INSERT INTO Appointment...
    activate DB
    DB-->>ApptDAO: 15: return appointmentId
    deactivate DB
    ApptDAO-->>Model: 16: return appointmentId
    deactivate ApptDAO
    Model-->>Servlet: 17: return appointmentId
    deactivate Model
    Servlet-->>Browser: 18: redirect to payment page
    deactivate Servlet
\\\

---

## UC 2.4 — Pay for Appointment

### Sequence Diagram
\\\mermaid
sequenceDiagram
    actor Patient as Patient
    participant Browser
    participant Servlet as PaymentServlet
    participant Model as PaymentModel
    participant PmtDAO as PaymentDAO
    participant ApptDAO as AppointmentDAO
    participant DB as Database

    Patient->>Browser: 1: Click "Pay Now"
    Browser->>Servlet: 2: POST initiatePayment(appointmentId)
    activate Servlet
    Servlet->>Model: 3: initiatePayment(appointmentId)
    activate Model
    Model->>PmtDAO: 4: createPayment(payment)
    activate PmtDAO
    PmtDAO->>DB: 5: INSERT INTO Payment...
    activate DB
    DB-->>PmtDAO: 6: return success
    deactivate DB
    PmtDAO-->>Model: 7: return paymentId
    deactivate PmtDAO
    Model-->>Servlet: 8: return gateway URL
    deactivate Model
    Servlet-->>Browser: 9: redirect to Payment Gateway
    deactivate Servlet
    Note over Browser: Patient completes payment on gateway
    Browser->>Servlet: 10: GET /payment/callback?txId=?
    activate Servlet
    Servlet->>Model: 11: handleCallback(transactionId)
    activate Model
    Model->>PmtDAO: 12: updatePaymentStatus(id, PAID)
    activate PmtDAO
    PmtDAO->>DB: 13: UPDATE Payment SET status=PAID
    activate DB
    DB-->>PmtDAO: 14: return success
    deactivate DB
    PmtDAO-->>Model: 15: return result
    deactivate PmtDAO
    Model->>ApptDAO: 16: updateStatus(appointmentId, CONFIRMED)
    activate ApptDAO
    ApptDAO->>DB: 17: UPDATE Appointment SET status=CONFIRMED
    activate DB
    DB-->>ApptDAO: 18: return success
    deactivate DB
    ApptDAO-->>Model: 19: return result
    deactivate ApptDAO
    Model-->>Servlet: 20: return success
    deactivate Model
    Servlet-->>Browser: 21: render booking confirmation
    deactivate Servlet
\\\

;

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully rewrote Mermaid diagrams.');
