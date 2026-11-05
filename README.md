# SHUDHI LOGISTICS — Integrated Operations & Management Platform

An integrated multi-city logistics operations management platform and ERP system for coordinating:
1. **First-Mile Pickup** from customers or 13 regional sub-agents.
2. **Mid-Mile Intercity Transportation** through APSRTC Logistics.
3. **Last-Mile Door Delivery** through independent local delivery partners.
4. **Sub-Agent Network Management & Settlements**.
5. **Customer Communications & Tracking**.
6. **Financial Commercial Ledger & Net Profit Margin Engine**.
7. **WhatsApp Business Single-Number Central Message Router**.

---

## 1. Network Structure & Regional Hubs

SHUDHI operates across 4 central hubs with 13 certified sub-agents and local ground partner fleets:

| City Hub | Hub Facility Location | Sub-Agents (13) | Local Partners |
|---|---|---|---|
| **Visakhapatnam** | Plot 42, Sector 3, MVP Colony | `VSP-A1`, `VSP-A2`, `VSP-A3`, `VSP-A4`, `VSP-A5` | `VSP-P1`, `VSP-P2` |
| **Rajamahendravaram** | Main Road, Danavaipeta | `RJY-A1` | `RJY-P1` |
| **Vijayawada** | Near Benz Circle, MG Road | `VJW-A1`, `VJW-A2`, `VJW-A3`, `VJW-A4` | `VJW-P1`, `VJW-P2` |
| **Hyderabad** | KPHB Phase 3, Kukatpally | `HYD-A1`, `HYD-A2`, `HYD-A3` | `HYD-P1`, `HYD-P2` |

---

## 2. Role-Based Access Control (RBAC)

The application enforces strict data boundaries:

1. **SHUDHI ADMIN / HQ**: Full operational visibility across all hubs, approval authority, rate configuration, settlements, unified WhatsApp inbox, and audit logs.
2. **SUB-AGENT**: Individual logins for any of the 13 agents. Sub-agents can only create and view **their own** bookings, tracking progress, and commission margin statements. Unrelated agents' records remain inaccessible.
3. **LOCAL GROUND PARTNER**: Mobile-first optimized experience. Partners can only see **assigned tasks**, accept/reject, open turn-by-turn Google Maps, upload photographic proof of pickup & proof of delivery, and log failure reasons.
4. **CUSTOMER**: Self-service tracking portal and booking request creator. Internal financial margins and transporter costs are hidden from customers.

*Quick demo switching is available in the top bar identity dropdown.*

---

## 3. Financial Calculation & Profitability Formula

The commercial engine computes net operational contribution without double-counting:

$$\text{Net Operational Contribution} = \text{Customer Freight Billed} - \text{APSRTC Bus Freight} - \text{Pickup Cost} - \text{Delivery Cost} - \text{Sub-Agent Margin}$$

- If pickup or delivery costs are assigned as sub-agent responsibilities, they are not deducted from SHUDHI's account.
- Direct external payments vs internal margins are strictly separated in independent ledgers.

---

## 4. WhatsApp Business Architecture

All communications run through a **single official Cloud API number** backed by a **Central Message Router** directing traffic into three specialized logical assistants:
- **Assistant 1 (Customer Care)**: Booking submission, automated status tracking, address queries.
- **Assistant 2 (Agent Desk)**: Commands like `TODAY REPORT`, `PENDING BOOKINGS`, `MY SHIPMENTS`, `PAYMENT SUMMARY`.
- **Assistant 3 (Field Operations)**: Ground rider workflow with `PENDING TASKS`, `ACCEPT [ID]`, `COMPLETED [ID]`, and `FAILED [ID]`.

The simulator mutates the shared database in real-time.

---

## 5. Technology Stack & Verification

- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React icons
- **State & Storage**: AppContext with localStorage persistence (IndexedDB/Supabase ready)
- **Reports**: 15 downloadable real-time CSV operational reports

---

## 6. Development & Run Commands

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Compile and verify types
npm run build
npm run lint
```
