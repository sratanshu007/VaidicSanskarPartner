# Vaidic Sanskar — Partner Portal (Vendor App)

The **vendor-side** React Native (Expo) app for the Vaidic Sanskar platform.
One app, **four roles** — Purohit/Pandit, E-Store Merchant, Bhajan Mandali
Leader, Astrologer/Guru — with role-based dashboards, real-time job alerts
(WebSocket), geofencing, push notifications (FCM) and a vendor earnings wallet.

Companion to the **user app** (`VaidicSanskar`). Runnable end-to-end scaffold:
every screen renders & navigates in Expo Go with mock data + demo real-time
events. Developer wires backend, keys and native SDKs for production.

---

## 1. Run
```bash
npm install
npx expo start      # a=Android, i=iOS, w=web, or scan QR in Expo Go
```
Node 18+. Native bits (maps, location geofencing, image upload, Agora calls,
FCM) need a dev build: `npx expo prebuild && npx expo run:android`. In Expo Go
they degrade gracefully (stubs / demo) so the whole flow stays testable.

### Demo tip
Login → OTP (any) → pick a role → finish KYC → "Enter Dashboard". For the
**Pandit** role, turn the **Online** switch on and wait ~4s — the geofenced
**broadcast overlay** (180s timer) pops up. **Astrologer** role: go Online and
an incoming-call modal appears in ~5s.

---

## 2. Tech & Architecture
| Layer | Choice |
|------|--------|
| Framework | React Native + Expo (Android/iOS) |
| Navigation | React Navigation — stack + **dynamic role-based bottom tabs** |
| State | Provider/Context (`src/context/PartnerContext.js`) — role, online status, rates, earnings, inventory, orders, inquiries, slots |
| REST | axios + per-role typed services (`src/services/api.js`) |
| Real-time | `src/services/socket.js` — WebSocket (job alerts, calls) with reconnect + `simulate()` |
| Timers | `src/services/hooks.js` — `useCountdown` (180s broadcast, 2h SLA), `useElapsed` (in-call) |

### Dynamic tabs (`src/navigation/RoleTabs.js`)
Tabs render per the vendor's role; **Earnings** + **Profile** are common:
- **Pandit** → Jobs · Slots · Earnings · Profile
- **Merchant** → Orders · Inventory · Earnings · Profile
- **Mandali** → Inquiries · Earnings · Profile
- **Astrologer** → Live · Earnings · Profile

---

## 3. Modules

### Onboarding (all roles)
- Role selector (4 roles) → **step-by-step KYC**: details, documents
  (ID/Aadhaar/PAN, certificate, photo), bank (account, IFSC, UPI) + base city &
  operational radius → verification pending.

### Role 1 — Purohit / Pandit
- Online/offline availability toggle + today stats.
- **Geofenced broadcast overlay** — pops when a puja lands in radius; shows
  puja, distance, earnings, samagri, and a **180-second acceptance timer**.
- **Accept** locks the assignment · **Decline/timeout** passes to next vendor.
- **Active Job** — navigation route (Maps URL scheme), **masked** customer
  chat.
- **Completion OTP** — enter customer's 4-digit code → completes job, **unlocks
  payout**, triggers **dual rating**.
- **Slot Locking Engine** — calendar slots; booked slots auto-lock so only
  **one active booking per slot** (overlaps blocked).

### Role 2 — E-Store Merchant
- **Inventory** — add/edit product (title, price, stock, image, category),
  quick stock +/−.
- **Order Lifecycle** — New → Packed → Ready for Courier → Delivered, advanced
  with one tap.

### Role 3 — Bhajan Mandali
- **Inquiry Queue** — each with a live **2-Hour SLA countdown**; Accept /
  Reject-with-reason / Counter-offer.
- **Media Portfolio** — upload performance clips, photos, group size.

### Role 4 — Astrologer / Vartalap
- **Online/Offline** status for Chat / Audio / Video availability.
- **Dynamic rate configurator** — per-minute rate per channel.
- Incoming-request modal → **In-Call overlay** with live **duration + accrued
  earnings** counter (credited to wallet on end).

### Earnings & Wallet (all roles)
- Net earnings dashboard: Gross → Commission (15%) → Net → Settled breakdown.
- **Instant Payout** request to bank + automated ledger entry.

---

## 4. Real-time events (`socket.js`)
| Event (server→app) | Drives |
|---|---|
| `job:broadcast` | Pandit geofenced popup (+180s) |
| `job:taken` | Dismiss popup (another vendor took it) |
| `order:new` | Merchant new order |
| `inquiry:new` | Mandali inquiry |
| `call:incoming` | Astrologer incoming request |
| `earnings:update` | Wallet refresh |

App→server: `vendor:online`, `vendor:location`, `job:accept`, `job:decline`.
`mock:true` makes it demoable; set `WS_URL` + `mock=false` for production.

---

## 5. Developer TODO
1. **Backend** — set `BASE_URL`, confirm endpoint paths (`api.js`).
2. **WebSocket** — `socket.js` → `mock=false`, set `WS_URL`.
3. **Geofencing** — `expo-location` background location → emit `vendor:location`;
   server matches jobs to radius and emits `job:broadcast`.
4. **Push (FCM)** — `expo-notifications`; high-priority data push wakes the app
   for job broadcasts even when backgrounded (pair with the socket).
5. **Maps** — add key in `app.json` (`react-native-maps` plugin).
6. **Image upload** — `expo-image-picker` → multipart `VendorService.uploadKyc`
   and product images.
7. **Calls** — Agora/WebRTC in `InCallScreen` (metering/earnings logic ready).
8. **Payouts** — RazorpayX / Cashfree Payouts in `PayoutScreen` + ledger.

### ⚠️ Security
Keep bank details & KYC docs encrypted at rest; never ship any admin/service
key in the app (the original platform APK had leaked one — rotate it).

---

## 6. Structure
```
src/
  theme/       colors, styles
  context/     PartnerContext (role + online + rates + earnings + data)
  services/    api (REST), socket (WS job alerts), hooks (timers)
  components/  ui, widgets (Sheet/Chip/Tag/StatTile/Stepper/Avatar)
  data/        mock.js
  navigation/  RootNavigator, RoleTabs (dynamic)
  screens/
    auth/ onboarding/ pandit/ merchant/ mandali/ astro/ earnings/ common/ ProfileScreen
```
Every screen functional & navigable; backend + native SDKs are the final touch.
