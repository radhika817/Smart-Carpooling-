# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Riders / Passengers:** Daily commuters, students, and office workers seeking affordable, safe, and reliable shared journeys.
- **Drivers / Car Owners:** Vehicle owners looking to offset commute fuel costs, meet verified peers, and reduce road congestion.
- **Platform Administrators:** Community managers overseeing user identity verification, safety reports, SOS incidents, and operational analytics.

## Product Purpose

SmartRide is a real-time, community-centric carpooling and ride-sharing web platform. It connects drivers with empty seats to commuters traveling along matching routes, enabling cost-effective, eco-friendly transit with real-time GPS tracking, dual-role workflows, and robust safety protocols.

## Positioning

Unlike anonymous ride-hailing services or ad-hoc chat groups, SmartRide provides an institutional, high-trust carpooling network featuring:
- Real-time Leaflet GPS route tracking and public trip sharing links.
- Instant SOS emergency dispatch with automated SMS/email alerts to trusted contacts.
- Verified institution badges (Driver License, Government ID).
- Smart fair-pricing split calculator and personal eco-analytics (CO₂ saved, money saved).

## Operating Context

- Mobile and desktop responsive web browsers used in on-the-go commuter settings.
- Dual-role toggle allowing users to switch seamlessly between rider mode and driver mode without separate accounts.
- Active ride sessions requiring live socket-driven map updates and telemetry.

## Capabilities and Constraints

- **Live Telemetry:** Socket.io bidirectional location updates and in-ride live chat.
- **Mapping:** Leaflet/OpenStreetMap routing with waypoint geocoding.
- **Safety First:** SOS modal, trusted emergency contacts, ride PIN verification, and real-time public tracking links.
- **Carpool Groups:** Recurring community rides for workplaces and universities.
- **Design Tokens:** High-contrast light canvas (`#F6F8F7`), Forest Emerald primary (`#047857`), Sunrise Amber secondary (`#C2410C`), 3-tier card hierarchy, Plus Jakarta Sans display typography, Inter body typography.

## Brand Commitments

- **Name:** SmartRide
- **Voice:** Confident, trustworthy, precise, and reassuring.
- **Visual Stance:** Crisp, tactile light aesthetic avoiding generic AI dark-mode clichés or muddy contrast.
- **Identity Colors:** Forest Emerald (`#047857` / `#059669`) and Sunrise Amber (`#C2410C` / `#F97316`).

## Evidence on Hand

- Complete React 18 SPA (`frontend/src/`) with Tailwind CSS and Vite.
- Express 4 + MongoDB backend (`backend/src/`) with JWT authentication and Socket.io.
- Deployed on Vercel (`smart-carpooling.vercel.app`) and Render (`smart-carpooling-backend.onrender.com`).

## Product Principles

1. **Safety and Trust Outrank Novelty:** Verification badges, SOS affordances, and live tracking are visible and instant.
2. **Effortless Scanning:** Critical ride metrics (seats, departure time, price, route) are readable in under 2 seconds.
3. **Tactile Elevation:** True 3-tier surface hierarchy (canvas, cards, recessed panels) instead of flat gray or muddy blur.
4. **Accessible by Default:** All text and interactive targets strictly meet or exceed WCAG AA 4.5:1 contrast standards.

## Accessibility & Inclusion

- Strict adherence to WCAG AA color contrast (minimum 4.5:1 for body copy, 3:1 for large headers).
- Minimum 44x44px touch targets for mobile interactives.
- Semantic HTML form controls with visible label associations and screen-reader status live-regions.
