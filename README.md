# TAJ Kulture Backend

**TAJ Kulture** is a streetwear clothing brand for Nigerian Gen Z. This backend serves as the core e‑commerce, community, and gamification platform – built with **NestJS**, **Prisma**, **PostgreSQL**, **Redis**, and **Bull** queues.

---

## 🚀 Features (Production‑Ready MVP)

### Core Commerce
- **User Auth** – OTP via SMS/email, JWT access + refresh tokens, logout.
- **Product Catalog** – Full CRUD, variants (size/color), limited drops (time‑based).
- **Shopping Cart** – Persistent cart stored in Redis.
- **Checkout & Payments** – Paystack integration, webhook verification, order status management.
- **Inventory Management** – Auto‑deduct stock after payment (async via Bull).
- **Order History** – Users can view past orders and statuses.

### Unique Street Culture Features
- **Voice Reviews** – Upload audio reviews (Cloudinary), optional text comment, verified purchase badge.
- **Lookbook** – Users upload outfit photos, tag products, admin moderation. Approved posts earn Sabi points.
- **Sabi Score** – Gamified loyalty points earned by:
  - Registration (10 pts)
  - Referral (50 pts for referrer)
  - Lookbook approval (15 pts)
  - Order completion (20 pts)
- **Referral System** – Unique codes, reward both parties, track conversions.

### Admin Capabilities
- Manage products, variants, limited drops.
- Moderate lookbook posts (approve/reject).
- View pending reviews and orders.
- analytics dashboard endpoints.

### Event‑Driven & Asynchronous Processing
- **Domain Events** – `UserRegistered`, `OrderPaid`, `LookbookApproved`, `LowStock`.
- **Bull Queues** – Email, push notifications, inventory deduction, Sabi score updates, analytics.
- **Event Handlers** – Decouple side effects from main transaction.

---

## 🧱 Tech Stack

| Layer          | Technology                               |
|----------------|------------------------------------------|
| Framework      | NestJS (Node.js + TypeScript)            |
| Database       | PostgreSQL (with Prisma ORM)             |
| Cache / OTP    | Redis (ioredis)                          |
| Queues         | Bull (backed by Redis)                   |
| File Storage   | Cloudinary (images, audio)               |
| Payments       | Paystack                                 |
| Email / SMS    | Termii / SendGrid                        |
| Testing        | Jest                                     |
| Deployment     | Docker + GitHub Actions       |

---

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/          # OTP, JWT, registration
│   ├── user/          # Profile, Sabi score, referrals
│   ├── product/       # Catalog, variants, drops
│   ├── order/         # Cart, checkout, Paystack webhook
│   ├── review/        # Text + voice reviews
│   ├── lookbook/      # UGC gallery, moderation
│   └── upload/        # Cloudinary file uploads
├── shared/
│   ├── infrastructure/ # Prisma, Redis, Bull queues, Cloudinary
│   └── utils/         # Cloudinary URL parser, OTP generator
├── common/            # Guards (JWT, roles), decorators
└── config/            # Environment configuration
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for Postgres + Redis)
- Cloudinary account (for file uploads)
- Paystack test keys

### 1. Clone & Install

```bash
git clone https://github.com/your-org/taj-kulture-backend.git
cd taj-kulture-backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taj_kulture?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=another_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_CALLBACK_URL=https://your-frontend.com/order/success

# SMS (Termii) – optional
TERMII_API_KEY=...
TERMII_SENDER_ID=TAJKulture
```

### 3. Start Dependencies (Docker)

```bash
docker-compose up -d   # PostgreSQL + Redis
```

### 4. Database Migrations & Seed

```bash
npx prisma migrate dev --name init
npx prisma generate
# Optional: seed initial admin user and products
npm run seed
```

### 5. Run the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 6. Run Tests

```bash
# Unit tests
npm run test

# Specific module
npm run test -- auth.service.spec.ts

# E2E (if any)
npm run test:e2e
```

---

## 🔌 API Overview (Key Endpoints)

### Authentication

| Method | Endpoint                  | Description |
|--------|---------------------------|-------------|
| POST   | `/auth/request-otp`       | Request OTP (SMS placeholder) |
| POST   | `/auth/verify-otp`        | Verify OTP, login/register |
| POST   | `/auth/refresh`           | Get new access token |
| POST   | `/auth/logout`            | Invalidate refresh token |

### Products (Public)

| Method | Endpoint                     | Description |
|--------|------------------------------|-------------|
| GET    | `/products`                  | List products (filters: category, collection, search, pagination) |
| GET    | `/products/:slug`            | Get product with variants |
| GET    | `/products/:productId/variants` | List variants of a product |

### Cart & Orders (Authenticated)

| Method | Endpoint                  | Description |
|--------|---------------------------|-------------|
| GET    | `/order/cart`             | Get current cart |
| POST   | `/order/cart`             | Add item to cart |
| DELETE | `/order/cart/:variantId`  | Remove item |
| POST   | `/order/checkout`         | Create order, return Paystack URL |
| POST   | `/order/webhook/paystack` | Paystack webhook (public) |

### Reviews

| Method | Endpoint                     | Description |
|--------|------------------------------|-------------|
| GET    | `/reviews/product/:productId` | List product reviews (public) |
| POST   | `/reviews/product/:productId` | Create review (text + optional audioUrl) |
| DELETE | `/reviews/:id`               | Delete own review |

### Lookbook

| Method | Endpoint                     | Description |
|--------|------------------------------|-------------|
| GET    | `/lookbook`                  | Public gallery (approved only) |
| POST   | `/lookbook`                  | Upload lookbook post (pending) |
| GET    | `/lookbook/me`               | My posts |
| PUT    | `/lookbook/:id/moderate`     | Admin approve/reject |

### User Profile

| Method | Endpoint        | Description |
|--------|-----------------|-------------|
| GET    | `/users/me`     | Get profile |
| PATCH  | `/users/me`     | Update profile (avatarUrl, fullName) |
| POST   | `/users/referral/apply` | Apply referral code |

### Admin (Requires `role: admin`)

| Method | Endpoint                     | Description |
|--------|------------------------------|-------------|
| POST   | `/products`                  | Create product |
| PUT    | `/products/:id`              | Update product |
| DELETE | `/products/:id`              | Delete product + images |
| POST   | `/products/:productId/variants` | Add variant |
| GET    | `/lookbook/admin/pending`    | Pending lookbook posts |

---

## 🧠 Event‑Driven Architecture

All side effects are handled asynchronously via **domain events** and **Bull queues**.

| Event                  | Trigger                        | Queued Jobs                         |
|------------------------|--------------------------------|--------------------------------------|
| `auth.user.registered` | New user registers             | Welcome email, push notification, analytics |
| `order.created`        | Checkout completed             | Order confirmation email, push notification |
| `order.paid`           | Paystack webhook success       | Inventory deduction, Sabi score (+20), payment confirmation email |
| `lookbook.post.approved` | Admin approves lookbook      | Push notification, Sabi score (+15) |
| `product.lowStock`     | Variant stock ≤5               | Admin email alert, push notification |

**Queue workers** (`email`, `notification`, `inventory`, `sabi-score`, `analytics`) run in the background with retries and error handling.

---

## 🧪 Testing Strategy

- **Unit tests** for all services, controllers, and event handlers.
- **Mock repositories** (Prisma), external services (Cloudinary, Paystack), and Redis.
- **Coverage** >80% for critical modules (auth, order, product, lookbook).
- Run `npm run test:cov` to view coverage report.

Example test files:
- `auth.service.spec.ts`
- `order.service.spec.ts`
- `product.service.spec.ts`
- `lookbook.service.spec.ts`
- `upload.controller.spec.ts`

---

## 🐳 Docker Deployment (Production)

Build and run with Docker Compose:

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    env_file: .env.production
  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
volumes:
  pgdata:
```

Build & start:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📦 Seed Script (Example)

Run `npm run seed` to populate:
- Admin user (email: admin@tajkulture.com, role: admin)
- Sample products (t‑shirts, hoodies, caps)
- Lookbook posts for testing

---

## 🔐 Security & Best Practices

- JWT access tokens (short‑lived) + refresh tokens (stored hashed).
- Rate limiting (`ThrottlerModule`) on auth endpoints.
- Paystack webhook signature verification (HMAC‑SHA512).
- Cloudinary uploads with resource type auto‑detection.
- Prisma migrations with indexes for performance.
- No hard‑coded secrets – all via environment variables.

---

## 🧑‍💻 Development Notes

### Adding a new module
1. Create module, controller, service with DDD‑lite structure.
2. Add repository interface and Prisma implementation.
3. Define domain events (if needed).
4. Register in `app.module.ts`.
5. Write unit tests.

### Working with queues
- Emit event from service: `eventEmitter.emit('order.paid', new OrderPaidEvent(...))`.
- Handler dispatches Bull job: `queueService.addInventoryJob(orderId)`.
- Processor (e.g., `InventoryProcessor`) performs actual work.

### File uploads
- Frontend uploads file to `/upload/single` → gets `{ url, publicId }`.
- Backend receives URL in DTO and stores it.
- On delete/update, extract `publicId` and call `cloudinaryService.deleteFile()`.

---

## 📈 Future Enhancements (Post‑MVP)

- Promo codes / discounts
- Geo‑drops (city‑specific products)
- Community voting for next drop
- Real‑time WebSocket notifications
- Shipping integration (GIG Logistics)
- Admin analytics dashboard
- Push notifications (Firebase)

---

## 👥 Contributing

Internal use only (TAJ Kulture team). Follow conventional commits and run tests before pushing.

---

## 📄 License

Proprietary – all rights reserved.

---

**TAJ Kulture – Where street culture meets community.**  
Built with ❤️ for Nigerian Gen Z.
