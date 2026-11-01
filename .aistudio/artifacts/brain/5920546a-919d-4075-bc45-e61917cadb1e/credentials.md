# BEMS Confidential System Credentials & Multi-Unit Directory

> **CONFIDENTIAL NOTICE:** Per security directives, all usernames, passwords, and PINs have been completely removed from public view in the application interface. Access credentials are cataloged exclusively in this document.

---

## 1. Corporate Super-Admin (Global Access)

| Attribute | Specification |
| :--- | :--- |
| **Role** | **SuperAdmin** |
| **Unit Call / Code** | `ALL` *(Can access all hotel units)* |
| **Username** | `superadmin` |
| **Password** | `4791@trt` |
| **Scope & Privileges** | Full cross-unit administrative authority. Active unit dropdown switcher in the header to switch between properties on the fly. Full access to register new hotel properties (`KA01`, `DL02`, etc.) and export/import unit backups. |

---

## 2. Unit-Level Administrators & Staff

### Property Unit: `TN01` — The Residency Towers, Chennai

| Role | Username | Password | PIN | Name & Department | Unit Code | Dropdown Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `John` | `4791@trt` | `4791` | John Rao *(Unit Admin)* | `TN01` | **Inactive / Locked** to `TN01` |
| **Editor** | `Priya` | `1234` | `4321` | Priya Sharma *(Sr. Sales Mgr)* | `TN01` | **Inactive / Locked** to `TN01` |
| **Commenter** | `Ramesh` | `1234` | `5678` | Ramesh Kumar *(Ops Exec)* | `TN01` | **Inactive / Locked** to `TN01` |
| **Collaborator** | `Suresh` | `1234` | `9012` | Suresh Rajan *(Floor Coord)* | `TN01` | **Inactive / Locked** to `TN01` |

*Unit staff and Unit Admins have administrative rights strictly scoped to `TN01`. They cannot access `SM00` or switch units.*

---

### Property Unit: `SM00` — TrialHall (Sales Pitch Blank Sandbox)

| Role | Username | Password | PIN | Name & Department | Unit Code | Dropdown Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `demo` | `demo123` | `1234` | TrialHall Sales Pitch Admin | `SM00` | **Inactive / Locked** to `SM00` |

*Pre-configured for live sales pitches with zero bookings. Includes 1-click **"Reset Blank Pitch State"** button to purge demonstration test data instantly.*

---

## 3. Login Instructions

1. **For Super-Admin:**
   - Enter **Hotel Unit / Access Code:** `ALL`
   - Enter **Username:** `superadmin`
   - Enter **Password:** `4791@trt`
   - Click **Sign In**. Once inside, use the top bar **Unit Dropdown** to seamlessly switch to any property (`TN01`, `SM00`, or newly registered units).

2. **For Unit Admins / Staff (e.g. John on TN01):**
   - Enter **Hotel Unit / Access Code:** `TN01`
   - Enter **Username:** `John`
   - Enter **Password:** `4791@trt`
   - Click **Sign In**. The unit dropdown inside the header is displayed as locked/inactive, enforcing property security.
