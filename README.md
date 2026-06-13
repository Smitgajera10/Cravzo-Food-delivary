# 🍕 Cravzo - Food Delivery Platform

> A modern, scalable microservices-based food delivery application built with Node.js, React, and PostgreSQL. Supporting real-time order tracking, restaurant management, rider coordination, and payment processing.

**Live Demo:** [https://cravzo.webhop.me/](https://cravzo.webhop.me/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-System-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Running Services](#-running-services)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)

---

## 📍 Overview

Cravzo is a comprehensive food delivery solution designed to handle multiple user roles: **Customers**, **Restaurant Owners**, and **Riders**. The platform uses a microservices architecture to ensure scalability, maintainability, and independent deployment of services.

### Key Capabilities

- **Real-time Order Tracking** with live rider location updates
- **Restaurant Management** for menu and order handling
- **Rider Fleet Management** with assignment and routing
- **Payment Processing** via Stripe integration
- **Authentication & Authorization** with JWT and OAuth 2.0
- **Admin Panel** for restaurant and rider verification (pending)
- **Geolocation Services** for map-based delivery tracking

---


## 🏗️ System Architecture

```mermaid
flowchart TB

    User[👤 Customer / Restaurant / Rider]

    subgraph Frontend
        Client[React + Vite]
    end

    subgraph AWS["AWS EC2 + Docker Compose"]
        
        subgraph Services
            Auth[Auth Service]
            Restaurant[Restaurant Service]
            Rider[Rider Service]
            Realtime[Realtime Service]
            Utils[Utils Service]
        end

        RabbitMQ[(RabbitMQ)]

        subgraph Databases
            AuthDB[(Auth DB)]
            RestaurantDB[(Restaurant DB + PostGIS)]
            RiderDB[(Rider DB + PostGIS)]
        end
    end

    User --> Client

    Client --> Auth
    Client --> Restaurant
    Client --> Rider
    Client --> Realtime

    Auth --> AuthDB

    Restaurant --> RestaurantDB
    Rider --> RiderDB

    Restaurant --> RabbitMQ
    Rider --> RabbitMQ
    Utils --> RabbitMQ

    RabbitMQ --> Rider
    RabbitMQ --> Restaurant
    RabbitMQ --> Utils

    Realtime --> Client

    Restaurant --> Realtime
    Rider --> Realtime
```
## 🍔 Order Lifecycle

```mermaid
sequenceDiagram

    participant Customer
    participant Restaurant
    participant RabbitMQ
    participant Rider
    participant Realtime

    Customer->>Restaurant: Create Order

    Restaurant->>Restaurant: Save Order

    Customer->>Restaurant: Pay Order

    Restaurant->>Realtime: Order Created
    Realtime-->>Customer: Live Status

    Restaurant->>RabbitMQ: ORDER_READY_FOR_RIDER

    RabbitMQ->>Rider: Find Nearby Riders

    Rider->>Restaurant: Accept Delivery

    Restaurant->>Realtime: Rider Assigned

    Realtime-->>Customer: Rider Assigned

    Rider->>Realtime: Live Location Updates

    Realtime-->>Customer: Track Rider

    Rider->>Restaurant: Delivered

    Restaurant->>Realtime: Order Completed

    Realtime-->>Customer: Delivered
```

### Service Communication Pattern

```
Synchronous (HTTP/REST):
  Client ←→ Services (direct API calls)
  Services ←→ Services (inter-service calls)

Asynchronous (Message Queue):
  Restaurant Service → RabbitMQ → Rider/Utils Services
  Rider Service → RabbitMQ → Utils/Restaurant Services
  (Order events, delivery updates, notifications)
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **UI Library:** React Icons 5
- **Real-time:** Socket.io Client
- **Maps:** Leaflet + React-Leaflet
- **Authentication:** Google OAuth 2.0
- **Payments:** Stripe.js
- **HTTP:** Axios
- **State Management:** React Router DOM

### Backend Services
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js 5
- **Database ORM:** Prisma 7
- **Database:** PostgreSQL 12+
- **Message Queue:** RabbitMQ 3
- **Authentication:** JWT, Google Auth Library
- **File Upload:** Multer 2
- **File Encoding:** DataURI 4
- **Real-time:** Socket.io 4

### DevOps & Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Deployment:** AWS EC2 (current), Render & Vercel (planned)
- **Build Tools:** TypeScript, Concurrently

---

## 📁 Project Structure

```
Cravzo-Food-delivary/
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API client services
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # React Context
│   │   └── styles/                  # Tailwind CSS config
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── services/                        # Backend Microservices
│
│   ├── auth/                        # Authentication Service
│   │   ├── src/
│   │   │   ├── routes/              # API endpoints
│   │   │   ├── controllers/         # Business logic
│   │   │   ├── middleware/          # JWT, CORS validation
│   │   │   └── prisma/              # Database schema
│   │   ├── package.json
│   │   ├── .env
│   │   └── Dockerfile
│   │
│   ├── restaurant/                  # Restaurant Service
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── queue/               # RabbitMQ consumer
│   │   │   └── prisma/
│   │   ├── package.json
│   │   ├── .env
│   │   └── Dockerfile
│   │
│   ├── rider/                       # Rider Service (In Development)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── queue/
│   │   │   └── prisma/
│   │   ├── package.json
│   │   ├── .env
│   │   └── Dockerfile
│   │
│   ├── realtime/                    # Real-time Updates Service
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── socket/              # Socket.io event handlers
│   │   │   └── middleware/
│   │   ├── package.json
│   │   ├── .env
│   │   └── Dockerfile
│   │
│   ├── utils/                       # Utility Service
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── queue/               # RabbitMQ publisher/consumer
│   │   │   └── middleware/
│   │   ├── package.json
│   │   ├── .env
│   │   └── Dockerfile
│
├── .github/
│   └── workflows/
│       └── deploy.yml               # CI/CD Pipeline
│
├── docker-compose.yml               # Orchestration config
├── .env                             # Environment variables template
└── README.md                        # This file
```

---

## ✨ Features

### Customer Features
- 🔐 Sign up and login with email/Google OAuth
- 🍽️ Browse restaurants and menus
- 🛒 Add items to cart and place orders
- 💳 Payment processing via Stripe
- 🗺️ Real-time order tracking with live rider location
- 📱 Order history and status notifications
- ⭐ Rate restaurants and provide feedback

### Restaurant Features
- 📋 Manage menu items and categories
- 📸 Upload item images
- 📊 View incoming orders in real-time
- ✅ Accept/reject orders
- 🚴 Assign riders to orders
- 📈 Track order statistics
- 🔐 Restaurant dashboard with analytics
- ⏱️ Prepare time management

### Rider Features
- 🎯 View assigned delivery orders
- 📍 Real-time location tracking and navigation
- ✔️ Order status updates (picked up, delivered)
- 💰 Earnings tracking
- 📊 Delivery statistics
- 🔔 Real-time notifications

### Admin Features (Pending)
- ✅ Verify restaurant accounts
- ✅ Verify rider accounts
- 📊 Platform analytics and insights
- 👥 User management
- 🚫 Account moderation

---

## 📋 Prerequisites

Before running the project, ensure you have:

- **Node.js** v18+ and npm/yarn
- **Docker** and **Docker Compose**
- **PostgreSQL** 12+ (if running locally without Docker)
- **RabbitMQ** (included in Docker Compose)
- **Git**

### Required API Keys

Create `.env` files for each service with:

- **Google OAuth Credentials** (from Google Cloud Console)
- **Stripe API Keys** (from Stripe Dashboard)
- **Database Credentials** (PostgreSQL)
- **JWT Secret** (generate a random string)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Cravzo-Food-delivary.git
cd Cravzo-Food-delivary
```

### 2. Create Environment Files

Copy environment template and configure:

```bash
cp .env.example .env

# Configure each service
cp services/auth/.env.example services/auth/.env
cp services/restaurant/.env.example services/restaurant/.env
cp services/rider/.env.example services/rider/.env
cp services/realtime/.env.example services/realtime/.env
cp services/utils/.env.example services/utils/.env
```

### 3. Set Up Environment Variables

**Root `.env`:**
```env
RABBITMQ_USER=admin
RABBITMQ_PASS=admin123
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_AUTH_SERVICE=http://localhost:5000
VITE_RESTAURANT_SERVICE=http://localhost:5001
VITE_UTILS_SERVICE=http://localhost:5002
VITE_REALTIME_SERVICE=http://localhost:5004
VITE_RIDER_SERVICE=http://localhost:5005
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
FRONTEND_URL=http://localhost:3000
```

**Each service `.env`:**
```env
PORT=5000  # or respective port
DATABASE_URL=postgresql://user:password@localhost:5432/cravzo_auth
JWT_SECRET=your_random_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret
```

### 4. Install Dependencies

```bash
# Client
cd client && npm install

# Services (repeat for each)
cd services/auth && npm install
cd services/restaurant && npm install
cd services/rider && npm install
cd services/realtime && npm install
cd services/utils && npm install
```

---

## 🐳 Running Services

### Option 1: Using Docker Compose (Recommended)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

**Service URLs:**
- Frontend: `http://localhost:3000`
- Auth API: `http://localhost:5000`
- Restaurant API: `http://localhost:5001`
- Utils API: `http://localhost:5002`
- Realtime: `http://localhost:5004`
- Rider API: `http://localhost:5005`
- RabbitMQ Management: `http://localhost:15672`

### Option 2: Running Locally (Development)

**Terminal 1 - Client:**
```bash
cd client
npm run dev
# Accessible at http://localhost:5173
```

**Terminal 2 - Auth Service:**
```bash
cd services/auth
npm run dev
```

**Terminal 3 - Restaurant Service:**
```bash
cd services/restaurant
npm run dev
```

**Terminal 4 - Rider Service:**
```bash
cd services/rider
npm run dev
```

**Terminal 5 - Realtime Service:**
```bash
cd services/realtime
npm run dev
```

**Terminal 6 - Utils Service:**
```bash
cd services/utils
npm run dev
```

**Start RabbitMQ & PostgreSQL:**
```bash
docker compose up -d rabbitmq postgres
```

---

## 🌐 Deployment

### Current Deployment (AWS EC2)
- **URL:** https://cravzo.webhop.me/
- **CI/CD:** GitHub Actions (automatic deployment on main branch push)


## 🚀 Deployment Architecture

```mermaid
flowchart LR

    GitHub[GitHub Repository]

    Actions[GitHub Actions CI/CD]

    EC2[AWS EC2]

    Nginx[Nginx Reverse Proxy]

    Client[React Client]

    Auth[Auth Service]
    Restaurant[Restaurant Service]
    Rider[Rider Service]
    Realtime[Realtime Service]
    Utils[Utils Service]

    RabbitMQ[(RabbitMQ)]

    GitHub --> Actions
    Actions --> EC2

    EC2 --> Nginx

    Nginx --> Client

    Nginx --> Auth
    Nginx --> Restaurant
    Nginx --> Rider
    Nginx --> Realtime
    Nginx --> Utils

    Restaurant <--> RabbitMQ
    Rider <--> RabbitMQ
    Utils <--> RabbitMQ
```


#### Option 1: Render
- Deploy backend services and databases
- Auto-deploy on GitHub push
- Free tier with 0.5 CPU

```bash
# Create render.yaml for services
```

#### Option 2: Vercel
- Deploy React frontend
- Serverless functions (if needed)
- Connected to GitHub for auto-deploy

```bash
vercel --prod
```

### Manual Deployment Steps

**AWS EC2:**
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Clone/pull repository
cd ~/Cravzo-Food-delivary
git pull origin main

# Build and deploy services
docker compose build
docker compose up -d

# View deployment status
docker compose logs -f
```

---

## 📡 API Documentation

### Authentication Service (Port 5000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | User login with email/password |
| `/auth/google` | POST | Google OAuth authentication |
| `/auth/verify` | GET | Verify JWT token |
| `/auth/refresh` | POST | Refresh JWT token |

**Example Request:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Restaurant Service (Port 5001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/restaurants` | GET | List all restaurants |
| `/restaurants/:id` | GET | Get restaurant details |
| `/restaurants/:id/menu` | GET | Get restaurant menu |
| `/restaurants/:id/orders` | GET | Get restaurant orders |
| `/restaurants/:id/orders/:orderId` | PATCH | Update order status |
| `/restaurants/:id/upload-image` | POST | Upload menu item image |

### Rider Service (Port 5005)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/riders` | GET | List active riders |
| `/riders/:id` | GET | Get rider details |
| `/riders/:id/deliveries` | GET | Get rider's deliveries |
| `/riders/:id/location` | POST | Update rider location |
| `/riders/:id/earnings` | GET | Get rider earnings |

### Realtime Service (Port 5004)

**Socket.io Events:**
```javascript
// Client to Server
socket.emit('join-room', { orderId, userId });
socket.emit('update-location', { lat, lng, orderId });

// Server to Client
socket.on('order-status-updated', { status, orderId });
socket.on('rider-location-updated', { lat, lng, orderId });
socket.on('delivery-completed', { orderId, time });
```

### Utils Service (Port 5002)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/utils/send-email` | POST | Send email notification |
| `/utils/upload-file` | POST | Upload file to storage |
| `/utils/health` | GET | Service health check |

---

## 🗄️ Database Schema

### PostgreSQL Databases

**cravzo_auth:**
- `users` - User accounts and authentication
- `sessions` - JWT session tracking

**cravzo_restaurant:**
- `restaurants` - Restaurant profiles
- `menu_categories` - Menu organization
- `menu_items` - Food items with pricing
- `orders` - Customer orders
- `order_items` - Items in each order

**cravzo_rider:**
- `riders` - Rider profiles
- `deliveries` - Delivery records
- `rider_earnings` - Payment tracking
- `delivery_history` - Archived deliveries

### RabbitMQ Queues

```
order.created          → New order notifications
order.accepted         → Order accepted by restaurant
order.ready            → Order ready for pickup
delivery.assigned      → Rider assigned to delivery
delivery.picked_up     → Order picked up
delivery.completed     → Delivery completed
restaurant.verified    → Restaurant verification event
rider.verified         → Rider verification event
```

---

## 🧪 Testing

```bash
# Run tests for each service
cd services/auth && npm test
cd services/restaurant && npm test
cd services/rider && npm test

# Run linting
cd client && npm run lint
npm run build  # TypeScript type checking
```

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Token-based API authentication
- ✅ **OAuth 2.0** - Google authentication support
- ✅ **CORS Protection** - Cross-origin request validation
- ✅ **Environment Variables** - Sensitive data in .env files
- ✅ **Prisma ORM** - SQL injection prevention
- ✅ **Password Hashing** - Bcrypt for password storage
- ✅ **Rate Limiting** (Recommended - to be implemented)
- ✅ **Input Validation** - Zod/Joi validation

---

## 📊 Monitoring & Logging

### Health Checks
```bash
# Auth Service
curl http://localhost:5000/health

# Restaurant Service
curl http://localhost:5001/health

# Check all container status
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs restaurant

# Real-time logs
docker compose logs -f auth
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Add meaningful commit messages
- Test your changes before submitting PR

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 🎯 Roadmap

- [ ] **Admin Panel** - Restaurant and rider verification dashboard
- [ ] **Payment Analytics** - Advanced payment and revenue reports
- [ ] **Mobile App** - Native iOS/Android applications
- [ ] **Advanced Routing** - Optimized multi-stop delivery routes
- [ ] **AI Recommendations** - ML-based restaurant/food suggestions
- [ ] **Rating System** - User and restaurant rating/review system
- [ ] **Subscription Plans** - Premium features for restaurants
- [ ] **Analytics Dashboard** - Comprehensive platform analytics
- [ ] **API Rate Limiting** - Request throttling and quota management
- [ ] **Webhook Integrations** - Third-party service integrations


---

## 🙏 Acknowledgments

- Built with ❤️ using Node.js, React, and PostgreSQL
- Inspired by modern food delivery platforms
- Thanks to the open-source community

---

**Last Updated:** June 13, 2026 | **Status:** Active Development
