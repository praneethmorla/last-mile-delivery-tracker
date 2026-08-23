# Last-Mile Delivery Tracker

A comprehensive, full-stack logistics management platform where customers and admins can manage shipments, delivery agents are dynamically assigned, and status logs are audited.

## 🚀 Getting Started (Setup Guide)

To run the application locally, follow these simple steps:

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Install Dependencies
Run the following command at the root directory to install all packages for both backend and frontend workspaces:
```bash
npm install
```

### 2. Set Up Environment Variables
Inside the `backend/` directory, create a `.env` file (copied from `.env.example`):
```bash
cp backend/.env.example backend/.env
```
Default parameters are pre-configured to run out of the box.

### 3. Initialize the Database (Prisma + SQLite)
Generate the Prisma Client types and run migrations to create the local SQLite database (`dev.db`), then seed it with initial mock data:
```bash
# In the root workspace
npm run prisma:generate --workspace=backend
npm run prisma:migrate --workspace=backend
```
*Note: The migration script will automatically trigger the database seed script.*

### 4. Run the Application
You can run both the Express backend and Vite frontend concurrently in development mode:
```bash
npm run dev
```
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend API URL**: [http://localhost:5000](http://localhost:5000)

Alternatively, to build and run in production mode:
```bash
npm run build
npm start
```
The application will run on [http://localhost:5000](http://localhost:5000), serving both the API and the static React app.

---

## 🔑 Seeded Test Accounts

For evaluation, use the following seeded accounts (password for all is `password123`):

| Role | Email | Purpose / Abilities |
|---|---|---|
| **Admin** | `admin@lastmile.com` | Override status, manage zones/rates, trigger agent assignments. |
| **Customer** | `customer@example.com` | Book orders with live pricing preview, reschedule failed deliveries. |
| **Agent (North)** | `agent1@lastmile.com` | Update order delivery journey, set location/availability. |
| **Agent (South)** | `agent2@lastmile.com` | Alternate agent for reassignment. |

---

## 📐 Database Schema

The database models defined in Prisma (`backend/prisma/schema.prisma`):

1. **User**: Credentials, names, and roles (`ADMIN`, `CUSTOMER`, `AGENT`).
2. **Zone**: Geographic sector tags (e.g., "Zone North", "Zone South").
3. **Area**: Specific sub-sectors identified by unique postal codes mapped to a `Zone`.
4. **AgentProfile**: Link to `User`, tracks availability (`isAvailable`), GPS coordinates, and current zone.
5. **RateCard**: Defines intra/inter-zone rates (`baseCharge`, `ratePerKg`, `codSurcharge`) for B2B/B2C order categories.
6. **Order**: Stores package weight/dimensions, addresses, pricing, status, and agent assignments.
7. **OrderTimeline**: Immutable tracking history log mapping each status transition to an actor and timestamp.
8. **NotificationLog**: Historical records of all email and SMS status notifications.

---

## 🧮 Rate Calculation Logic

The pricing calculation is performed dynamically by `backend/src/services/rateEngine.ts` whenever an order is previewed or booked:

1. **Volumetric Weight**: Evaluates package volume using the industry coefficient:
   $$\text{Volumetric Weight (kg)} = \frac{L(\text{cm}) \times W(\text{cm}) \times H(\text{cm})}{5000}$$
2. **Chargeable Weight**: The system bills on the greater of actual vs volumetric weight:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Route & Category Selection**: Detects pickup and drop zones from postal codes, looks up the corresponding `RateCard` matching the zones and order type (B2B or B2C).
4. **Final Cost Calculation**:
   $$\text{Total Price} = \text{Base Charge} + (\text{Rate Per Kg} \times \text{Chargeable Weight}) + \text{COD Surcharge (if COD)}$$

---

## 🔌 API Endpoints Documentation

### Auth API
- `POST /api/auth/register` - Create a Customer or Agent.
- `POST /api/auth/login` - Authenticate and return JWT token.
- `GET /api/auth/me` - Fetch details of logged-in user.

### Customer API
- `GET /api/customer/areas` - Retrieve area postal code records.
- `POST /api/customer/orders/preview` - Calculate and preview order charges.
- `POST /api/customer/orders` - Book order and trigger auto-assignment.
- `GET /api/customer/orders` - View list of booked orders.
- `GET /api/customer/orders/:id` - Fetch order tracking details.
- `POST /api/customer/orders/:id/reschedule` - Reschedule failed delivery and reassign agent.

### Delivery Agent API
- `GET /api/agent/profile` - Fetch agent profile, coordinates, and availability.
- `PUT /api/agent/profile` - Update agent coordinates/availability.
- `GET /api/agent/orders` - List of assigned delivery tasks.
- `POST /api/agent/orders/:id/status` - Update order stage (updates agent availability if finished).

### Admin API
- `GET /api/admin/zones` \| `POST` \| `PUT` \| `DELETE` - CRUD zones configuration.
- `GET /api/admin/areas` \| `POST` \| `PUT` \| `DELETE` - CRUD area-to-zone maps.
- `GET /api/admin/ratecards` \| `POST` \| `PUT` \| `DELETE` - CRUD pricing sheets.
- `GET /api/admin/agents` \| `PUT` - Manage agent coordinates and statuses.
- `GET /api/admin/orders` - View all orders with status/zone/agent filters.
- `POST /api/admin/orders` - Book order on behalf of a customer.
- `GET /api/admin/orders/:id` - Detailed order view including timeline and notifications.
- `POST /api/admin/orders/:id/assign` - Assign agent manually or run auto-assignment algorithm.
- `POST /api/admin/orders/:id/override-status` - Override order state.
