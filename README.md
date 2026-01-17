# Payment Gateway Project

A comprehensive Payment Gateway solution featuring a Spring Boot backend, a Merchant Dashboard, and a secure Checkout Page. This project is containerized using Docker for easy deployment.

##  Table of Contents

- [Deliverable 2: Production-Ready Features](deliverable-2-production-ready-features)
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](installation--setup)
  - [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
  - [Manual Setup](#manual-setup)
- [Usage](#usage)
  - [Merchant Dashboard](#merchant-dashboard)
  - [Checkout Page](checkout-page)
  - [Test Credentials](#test-credentials)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

##  Overview

The Payment Gateway Project provides a simulated environment for processing payments. It consists of three main components:
1.  **Backend API**: Handles transaction processing, merchant authentication, and data persistence.
2.  **Merchant Dashboard**: A web interface for merchants to view transaction history and manage their account.
3.  **Checkout Page**: A hosted payment page where customers enter their payment details securey.

##  Architecture

The project follows a multi-tier, containerized architecture orchestrated via Docker Compose. It is divided into three primary layers to ensure scalability and separation of concerns:

1.  **Presentation Layer**: Contains the **Merchant Dashboard** for admin metrics and the **Checkout Page** for customer payments.
2.  **Logic Layer**: A **Spring Boot API** that handles transaction processing, validation, and asynchronous webhooks.
3.  **Persistence Layer**: A **MySQL Database** that ensures ACID transactions for all payment data.

<p align="center">
  <img src="screenshots/Architecture.png" width="800" alt="Payment Gateway Architecture Diagram">
</p>

The project follows a microservices-like architecture orchestrated via Docker Compose:

-   ** backend **: Spring Boot application exposing REST APIs.
-   ** dashboard **: React application for the merchant UI.
-   ** checkout **: React application for the payment page UI.
-   **db **: MySQL database for persistent storage.

##  Tech Stack

-   **Backend**: Java 17, Spring Boot 3.2.1, Spring Data JPA, Hibernate, MySQL Driver.
-   **Frontend**: React 19, Vite, Tailwind CSS, Axios.
-   **Database**: MySQL 8.0.
-   **Containerization**: Docker, Docker Compose.

##  Prerequisites

Ensure you have the following installed on your system:

-   **Docker** and **Docker Compose**
-   **Java 17** (for manual backend setup)
-   **Node.js 18+** (for manual frontend setup)
-   **Maven** (for manual backend build)

## Installation & Setup

### Using Docker Compose (Recommended)

The easiest way to run the entire stack is using Docker Compose.

1.  **Clone the repository:**
    ```bash 
    git clone <repository-url>
    cd payment-gateway-project
    ```

2.  **Start the services:**
    ```bash
    docker-compose up --build
    ```
    This command builds the images for the backend, dashboard, and checkout page, and starts the MySQL database.

3.  **Verify the services:**
    Once the logs settle, the services will be live at:
    -   **Merchant Dashboard**: [http://localhost:3000](http://localhost:3000)
    -   **Checkout Page**: [http://localhost:3001](http://localhost:3001)
    -   **Backend API**: [http://localhost:8000](http://localhost:8000)
    
### Manual Setup

If you prefer to run services individually without Docker:

#### 1. Database
Ensure a local MySQL instance is running with a database named `payment_gateway`. Update the `application.properties` in `backend/src/main/resources` with your credentials.

#### 2. Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### 3. Merchant Dashboard
```bash
cd frontend
npm install
npm run dev
```

#### 4. Checkout Page
```bash
cd checkout-page
npm install
npm run dev
```

##  Usage

### Merchant Dashboard
Access: [http://localhost:3000](http://localhost:3000)

**1. Login Screen**
Sign in using the provided test merchant credentials.
<p align="left">
  <img src="screenshots/Screenshot%202026-01-10%20110325.png" width="500" alt="Merchant Login Screen">
</p>

**2. Dashboard Overview**
Monitor total transactions, volume, and success rates.
<p align="left">
  <img src="screenshots/Screenshot%202026-01-10%20110342.png" width="700" alt="Merchant Dashboard Overview">
</p>

---

### Checkout & Payment Page
Access: [http://localhost:3001](http://localhost:3001)

**1. Order Summary**
The customer sees the amount to pay based on their unique Order ID.
<p align="left">
  <img src="screenshots/Screenshot%202026-01-10%20110412.png" width="500" alt="Order Summary">
</p>

**2. Payment Method Selection**
Customers can choose between **UPI** or **Card** payment methods.
<p align="left">
  <img src="screenshots/Screenshot%202026-01-10%20110427.png" width="400" alt="Payment Method Selection">
</p>

**3. Processing State**
Features a custom Razorpay-style spinning coin animation.
<p align="left">
  <img src="screenshots/Screenshot%202026-01-10%20110433.png" width="400" alt="Processing Animation">
</p>

**4. Payment Success Receipt**
A detailed receipt is generated with GST breakdown and transaction reference.
<p align="left">
  <img src="screenshots/Screenshot%202026-01-10%20110552.png" width="500" alt="Detailed Success Receipt">
</p>


### Test Credentials

Pre-configured test credentials for development (defined in `docker-compose.yml`):

-   **Merchant ID**: `550e8400-e29b-41d4-a716-446655440000`
-   **API Key**: `key_test_abc123`
-   **API Secret**: `secret_test_xyz789`

##  Project Structure

```
payment-gateway-project/
├── backend/                # Spring Boot Backend Code
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/               
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── checkout-page/          
│   ├── src/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml      
```

##  API Documentation

The backend API runs on port `8000`. Key endpoints include:

-   `POST /api/v1/payments`: Initiate a payment.
-   `GET /api/v1/payments/{transactionId}`: Get payment status.
-   `POST /api/v1/merchants`: Register a new merchant (if implemented).


---

