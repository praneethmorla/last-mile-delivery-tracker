# Last-Mile Delivery Tracker: System Design Document

This document outlines the core architectural components, algorithms, and design choices implemented in the Last-Mile Delivery Tracker application.

---

## 1. System Architecture

The application is structured as a monolithic Node.js monorepo containing an **Express API backend** (TypeScript) and a **Vite + React frontend** (TypeScript). To simplify deployment, the backend serves the built frontend static assets in production, allowing the entire application to run on a single port. The system uses **SQLite** combined with **Prisma ORM** for rapid setup, relational integrity, and automated schema migrations.

```
                  +--------------------------------+
                  |         React Frontend         |
                  |     (Vite + Tailwind CSS)     |
                  +---------------+----------------+
                                  | HTTP REST / JSON
                  +---------------+----------------+
                  |      Express API Backend       |
                  |     (Node.js + TypeScript)     |
                  +---+-------------+------------+-+
                      |             |            |
  +-------------------v---+   +-----v------+   +-v-------------------+
  | Rate Calc Engine      |   | Auto-Assign|   | Notification        |
  | - Volumetric weight   |   | Service    |   | Service             |
  | - Zone rate card lookup | | - Haversine|   | - DB logging & SMTP |
  +-----------------------+   +------------+   +---------------------+
                                    |
                        +-----------v------------+
                        |   Prisma Client / ORM  |
                        +-----------+------------+
                                    |
                        +-----------v------------+
                        |     SQLite Database    |
                        +------------------------+
```

---

## 2. Rate Calculation Engine

The rate calculation engine computes pricing dynamically based on physical package metrics and geographical routes without any hardcoded thresholds.

### Calculations and Weight-Billing
- **Volumetric Weight**: Logistics operations charge based on space utilized. The engine computes volumetric weight using the standard formula:
  $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
- **Chargeable Weight**: The billable weight is determined as the maximum value between the physical weight and the volumetric weight:
  $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

### Rate Cards & Dynamic Lookup
Admins configure rate cards detailing route costs:
- **Intra-zone**: Deliveries within the same zone.
- **Inter-zone**: Deliveries traversing separate zones.
- **Surcharges**: Surcharges for payment method types (e.g., COD) and client category tiers (B2B vs B2C).
The pricing formula applied is:
$$\text{Total Price} = \text{Base Charge} + (\text{Rate Per Kg} \times \text{Chargeable Weight}) + \text{COD Surcharge (if applicable)}$$

---

## 3. Zone Detection Approach

To identify the source and destination zones automatically:
1. **Area Mapping**: The system maintains an `Area` registry where each postal code (e.g., `110001`) is mapped to a specific `Zone` (e.g., `Zone North`).
2. **Detection Logic**: During order creation or price previewing, the engine takes the `pickupAreaId` and `dropAreaId` inputs and resolves their respective zones in the database via relations.
3. **Route Categorization**: If `pickupZoneId == dropZoneId`, the system selects the Intra-Zone rate card; otherwise, it resolves the Inter-Zone rate card matching the specific zone pairs.

---

## 4. Auto-Assignment Logic

The auto-assignment service targets the most suitable, active delivery agent:
1. **Filter by Availability**: Queries the database to find agents with status `isAvailable = true` who hold the role `AGENT`.
2. **Zone Matching**: Prioritizes available agents located within the order's pickup zone.
3. **Geodesic Distance Scoring**: For exact proximity mapping, the system retrieves the coordinates of the pickup postal code and the agent's GPS location. It applies the **Haversine formula** to calculate the distance on the earth's surface:
   $$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
   $$d = 2R \cdot \arctan2(\sqrt{a}, \sqrt{1-a})$$
   *(where $R = 6371$ km, $\phi$ is latitude, and $\lambda$ is longitude).*
4. **Scoring**: Penalty scores are calculated: agents outside the pickup zone receive a $1000$ km penalty score. The agent with the lowest score (closest zone + shortest geodesic distance) is selected.
5. **Atomic State Updates**: To prevent race conditions, the system uses a database transaction to bind the agent to the order, update the order status to `ASSIGNED`, and mark the agent's status as `isAvailable = false`.

---

## 5. Failed Delivery Handling

If an agent reports a delivery attempt as `FAILED`:
1. **Agent Release**: The agent is instantly marked as `isAvailable = true` so they can receive new assignments.
2. **Customer Alert**: An email/SMS notification is dispatched, logging a link for the customer to reschedule the delivery.
3. **Rescheduling Form**: The customer selects a new date from their dashboard.
4. **Reassignment Trigger**: When the customer submits the rescheduled date, the system sets the order status back to `PENDING` (or `RESCHEDULED`) and executes the auto-assignment service. This unassigns the old agent and searches for the nearest available agent for the new attempt, complying with all routing and proximity rules.
