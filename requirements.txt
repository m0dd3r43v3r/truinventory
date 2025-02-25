# TruInventory Requirements

## 1. Overview
TruInventory is an inventory management application that leverages a Dockerized PostgreSQL database and supports modern authentication using the **React AzureAD Integration**. The app is designed to be responsive, support role-based access control, and provide a consistent user experience across both desktop and mobile browsers.

## 2. Functional Requirements

### 2.1 Database & Authentication
- **Database**:  
  - The application will use **PostgreSQL** running in a **Docker container** as the backend database.
- **Authentication**:  
  - Users will authenticate using the **React AzureAD Integration**, allowing them to log in with their Microsoft accounts.

### 2.2 Audit Logging
- All primary actions—including **add**, **delete**, **edit**, **login**, and **logout**—must be recorded in an audit log.
- Audit log entries should include details such as user ID, timestamp, action type, and any relevant data changes.

### 2.3 Role-Based Access Control (RBAC)
- **RBAC Implementation**:  
  - The application must enforce RBAC rules to manage permissions and restrict access to specific actions.
- **User Roles**:  
  - Administrators should have the ability to assign and modify roles for individual users.

### 2.4 Item Management
- **Clickable Items**:  
  - Items stored in the app should be clickable. When clicked, a **details modal** should open to display further information.
- **CRUD Operations**:
  - **Add** and **Edit** operations will utilize modal dialogs instead of transitioning to separate pages.
  - **Delete** operations should also be captured in the audit log.
- **Custom Fields**:
  - Users should be able to create custom fields that are associated with specific categories.

### 2.5 Categorization and Locations
- **Categories & Locations**:  
  - Each item can be assigned to a specific category and location.
- **Filtering/Searching**:  
  - The app should provide functionality to filter and search items based on category and location.

### 2.6 QR Code Generation
- **QR Codes**:  
  - Users must be able to generate QR codes for each item.
  - Generated QR codes should be suitable for printing via a label printer.

### 2.7 Navigation & UI Components
- **Navigation**:  
  - The app will feature a **side bar** for navigation.
- **Modals**:  
  - **Add**, **Edit**, and **Item Details** should be presented in modal dialogs.
- **Theme Toggle**:  
  - Users must have the ability to toggle between **dark mode** and **light mode**.

### 2.8 Multi-Platform Support
- **Responsive Design**:  
  - The application must be optimized for use on both desktop and mobile browsers.

## 3. Non-Functional Requirements

### 3.1 Performance
- The application should load quickly and perform efficiently on both desktop and mobile devices.
- UI elements (e.g., modals, side bar) should be responsive and intuitive.

### 3.2 Security
- Secure authentication is ensured via the React AzureAD Integration.
- All user actions must be audit logged to provide traceability.
- RBAC must be implemented to prevent unauthorized access to sensitive operations.

### 3.3 Scalability & Maintainability
- The system should be designed for scalability to accommodate increased data and user activity.
- Code and architecture should be modular to facilitate future enhancements.

### 3.4 Usability
- The user interface should be intuitive, with clear navigation and interaction patterns.
- Modals should be used to enhance user experience for CRUD operations without full page reloads.
- QR code generation should be straightforward and easy to print.

## 4. System Architecture

### 4.1 Technology Stack
- **Backend**:
  - **PostgreSQL** running in a **Docker container** as the primary database.
  - **Authentication** via the **React AzureAD Integration** for Microsoft account logins.
- **Frontend**:
  - A modern JavaScript framework (e.g., **React**, **Vue**, or similar) to build the user interface.
  - Libraries for modal dialogs, side bar navigation, and theme toggling.
  - A QR code generation library to support the creation and printing of QR codes.

### 4.2 Deployment & Development Environment
- **Production**:
  - The application will be deployed inside a **Docker container** for consistency and ease of deployment.
- **Development**:
  - For development purposes, the application can be run using the command `npm run dev`.

## 5. User Roles and Permissions
- **Administrator**:
  - Full access to all features, including RBAC configuration and audit log reviews.
- **Manager**:
  - Access to CRUD operations on items with corresponding audit logging.
- **Standard User**:
  - Limited access primarily focused on viewing items and generating QR codes.

## 6. UI/UX Considerations

### 6.1 Layout & Navigation
- Use a **side bar** for main navigation between different sections of the app.
- Ensure a consistent and clear layout for both desktop and mobile views.

### 6.2 Modals
- **Item Details Modal**:
  - Triggered when an item is clicked, displaying detailed information.
- **Add/Edit Modal**:
  - Provide forms for adding or editing items without leaving the current page.

### 6.3 Theme Toggle
- Incorporate a toggle switch for users to easily switch between **dark** and **light** modes.

## 7. Audit Logging Details
- Log every critical action, including:
  - **Add**: When a new item is added.
  - **Edit**: When an item is modified.
  - **Delete**: When an item is removed.
  - **Login/Logout**: When users authenticate or exit the app.
- Each log entry should include:
  - **User ID and Role**
  - **Timestamp**
  - **Action performed**
  - **Additional context or data changes**

## 8. Appendices

### 8.1 Glossary
- **RBAC**: Role-Based Access Control.
- **PostgreSQL**: A powerful, open-source object-relational database system.
- **Docker Container**: A lightweight, standalone, executable package that includes everything needed to run a piece of software.
- **React AzureAD Integration**: A React-based integration to authenticate users via Microsoft Azure Active Directory.

### 8.2 References
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [React AzureAD Integration Documentation](https://github.com/syncweek-react-aad/react-aad)
- [Azure Authentication Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
