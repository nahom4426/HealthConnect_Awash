<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import CustomInput  from "@/components/new_form_elements/Input.vue";
import CustomSelect from "@/components/new_form_elements/Select.vue";

const route  = useRoute();
const router = useRouter();

// ── Insurance type definitions ─────────────────────────────────────────────
const TYPES = {
  motor: {
    name: "Motor Insurance",
    description: "Set base rates and loading factors for motor vehicle covers.",
    color: { from: "#1e3a8a", to: "#2563eb", accent: "#60a5fa", glow: "rgba(37,99,235,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 01-2-2v-4l2.5-5h13l2.5 5v4a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M7.5 15h9"/></svg>`,
    sections: [
      {
        title: "Vehicle Classification",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
        questions: [
          { id: "vehicle_type", label: "Vehicle Type", type: "select", options: ["Private Car", "Commercial Vehicle", "Motorcycle", "Minibus", "Heavy Truck"], required: true, help: "Category determines the base rate schedule." },
          { id: "vehicle_use", label: "Primary Use", type: "select", options: ["Personal", "Business", "Hire/Reward", "Government"], required: true },
          { id: "engine_cc", label: "Engine Capacity (CC)", type: "select", options: ["Up to 1000cc", "1001–1500cc", "1501–2000cc", "2001–3000cc", "Over 3000cc"], required: true },
          { id: "vehicle_age", label: "Vehicle Age", type: "select", options: ["Brand New (0 yr)", "1–3 Years", "4–6 Years", "7–10 Years", "Over 10 Years"], required: true },
        ],
      },
      {
        title: "Cover & Premium Rates",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        questions: [
          { id: "cover_type", label: "Cover Type", type: "select", options: ["Comprehensive", "Third Party Only", "Third Party Fire & Theft"], required: true },
          { id: "base_rate", label: "Base Premium Rate (%)", type: "rate", unit: "%", min: 0.5, max: 10, step: 0.01, required: true, help: "Percentage of vehicle sum insured." },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 100, required: true },
          { id: "max_premium", label: "Maximum Premium (ETB)", type: "number", unit: "ETB", min: 1000, required: false },
        ],
      },
      {
        title: "Loading & Discount Factors",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
        questions: [
          { id: "young_driver_loading", label: "Young Driver Loading (<25 yrs) (%)", type: "rate", unit: "%", min: 0, max: 50, step: 0.5, help: "Extra loading applied for drivers under 25." },
          { id: "ncb_1yr", label: "No-Claim Bonus – 1 Year (%)", type: "rate", unit: "%", min: 0, max: 20, step: 0.5 },
          { id: "ncb_2yr", label: "No-Claim Bonus – 2 Years (%)", type: "rate", unit: "%", min: 0, max: 30, step: 0.5 },
          { id: "ncb_3yr", label: "No-Claim Bonus – 3+ Years (%)", type: "rate", unit: "%", min: 0, max: 40, step: 0.5 },
          { id: "anti_theft", label: "Anti-Theft Device Discount (%)", type: "rate", unit: "%", min: 0, max: 15, step: 0.5 },
          { id: "fleet_discount", label: "Fleet Discount (5+ vehicles) (%)", type: "rate", unit: "%", min: 0, max: 25, step: 0.5 },
        ],
      },
      {
        title: "Excess & Deductibles",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        questions: [
          { id: "voluntary_excess", label: "Voluntary Excess (ETB)", type: "number", unit: "ETB", min: 0, help: "Amount policyholder agrees to bear per claim." },
          { id: "compulsory_excess", label: "Compulsory Excess (%)", type: "rate", unit: "%", min: 0, max: 20, step: 0.5 },
          { id: "windscreen_excess", label: "Windscreen Excess (ETB)", type: "number", unit: "ETB", min: 0 },
        ],
      },
    ],
  },
  fire: {
    name: "Fire Insurance",
    description: "Configure fire and allied perils rates for all property classes.",
    color: { from: "#7c2d12", to: "#ea580c", accent: "#fb923c", glow: "rgba(234,88,12,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z"/><path d="M12 12c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z"/></svg>`,
    sections: [
      {
        title: "Property Classification",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
        questions: [
          { id: "property_type", label: "Property Type", type: "select", options: ["Residential Building", "Commercial Building", "Industrial/Factory", "Warehouse", "Mixed Use"], required: true },
          { id: "construction", label: "Construction Type", type: "select", options: ["Fire-Resistant (Class A)", "Semi Fire-Resistant (Class B)", "Combustible (Class C)", "Non-Standard"], required: true, help: "Determines structural fire resistance rating." },
          { id: "occupancy", label: "Occupancy / Use", type: "select", options: ["Owner Occupied", "Tenanted – Office", "Tenanted – Retail", "Tenanted – Warehouse", "Vacant"], required: true },
          { id: "stories", label: "Number of Storeys", type: "select", options: ["1", "2–3", "4–6", "7–10", "Above 10"], required: true },
        ],
      },
      {
        title: "Premium Rates",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        questions: [
          { id: "base_rate_building", label: "Building Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 5, step: 0.01, required: true, help: "Rate per thousand of sum insured." },
          { id: "base_rate_contents", label: "Contents Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 5, step: 0.01, required: true },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 100, required: true },
          { id: "max_si", label: "Maximum Sum Insured per Risk (ETB)", type: "number", unit: "ETB", min: 0 },
        ],
      },
      {
        title: "Loading Factors",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
        questions: [
          { id: "sprinkler_discount", label: "Sprinkler System Discount (%)", type: "rate", unit: "%", min: 0, max: 25, step: 0.5 },
          { id: "fire_alarm_discount", label: "Fire Alarm Discount (%)", type: "rate", unit: "%", min: 0, max: 15, step: 0.5 },
          { id: "hazardous_loading", label: "Hazardous Occupancy Loading (%)", type: "rate", unit: "%", min: 0, max: 100, step: 1 },
          { id: "claims_loading", label: "Claims History Loading (%)", type: "rate", unit: "%", min: 0, max: 50, step: 0.5 },
        ],
      },
      {
        title: "Allied Perils Extension",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`,
        questions: [
          { id: "riot_rate", label: "Riot & Strike Rate (%‰)", type: "rate", unit: "‰", min: 0, max: 2, step: 0.01 },
          { id: "storm_rate", label: "Storm & Tempest Rate (%‰)", type: "rate", unit: "‰", min: 0, max: 2, step: 0.01 },
          { id: "flood_rate", label: "Flood Rate (%‰)", type: "rate", unit: "‰", min: 0, max: 3, step: 0.01 },
          { id: "earthquake_rate", label: "Earthquake Rate (%‰)", type: "rate", unit: "‰", min: 0, max: 5, step: 0.01 },
        ],
      },
    ],
  },
  health: {
    name: "Health Insurance",
    description: "Define premium bands for individual, family and group medical cover.",
    color: { from: "#064e3b", to: "#059669", accent: "#34d399", glow: "rgba(5,150,105,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    sections: [
      {
        title: "Plan & Cover Type",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 6v12M6 12h12"/></svg>`,
        questions: [
          { id: "plan_type", label: "Plan Type", type: "select", options: ["Individual", "Family (2 adults)", "Family Plus (2+children)", "Group (SME)", "Group (Corporate)"], required: true },
          { id: "cover_level", label: "Cover Level", type: "select", options: ["Basic / Essential", "Standard", "Enhanced", "Premium / Executive"], required: true },
          { id: "inpatient_limit", label: "Annual Inpatient Limit (ETB)", type: "number", unit: "ETB", required: true },
          { id: "outpatient_limit", label: "Annual Outpatient Limit (ETB)", type: "number", unit: "ETB", required: true },
        ],
      },
      {
        title: "Age Band Premiums",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        questions: [
          { id: "rate_0_17", label: "Age 0–17 Annual Premium (ETB)", type: "number", unit: "ETB", required: true },
          { id: "rate_18_35", label: "Age 18–35 Annual Premium (ETB)", type: "number", unit: "ETB", required: true },
          { id: "rate_36_50", label: "Age 36–50 Annual Premium (ETB)", type: "number", unit: "ETB", required: true },
          { id: "rate_51_60", label: "Age 51–60 Annual Premium (ETB)", type: "number", unit: "ETB", required: true },
          { id: "rate_61_plus", label: "Age 61+ Annual Premium (ETB)", type: "number", unit: "ETB", required: true },
        ],
      },
      {
        title: "Deductibles & Co-pay",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>`,
        questions: [
          { id: "annual_deductible", label: "Annual Deductible (ETB)", type: "number", unit: "ETB" },
          { id: "copay_gp", label: "Co-pay – GP Visit (%)", type: "rate", unit: "%", min: 0, max: 30, step: 1 },
          { id: "copay_specialist", label: "Co-pay – Specialist (%)", type: "rate", unit: "%", min: 0, max: 30, step: 1 },
          { id: "copay_hospital", label: "Co-pay – Hospitalisation (%)", type: "rate", unit: "%", min: 0, max: 20, step: 1 },
        ],
      },
      {
        title: "Loading & Discounts",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
        questions: [
          { id: "group_discount_10", label: "Group Discount 10–49 members (%)", type: "rate", unit: "%", min: 0, max: 20, step: 0.5 },
          { id: "group_discount_50", label: "Group Discount 50+ members (%)", type: "rate", unit: "%", min: 0, max: 35, step: 0.5 },
          { id: "smoker_loading", label: "Smoker Loading (%)", type: "rate", unit: "%", min: 0, max: 50, step: 1 },
          { id: "chronic_loading", label: "Chronic Condition Loading (%)", type: "rate", unit: "%", min: 0, max: 100, step: 1 },
        ],
      },
    ],
  },
  marine: {
    name: "Marine & Cargo",
    description: "Rate configuration for ocean freight, inland transit and hull.",
    color: { from: "#0c4a6e", to: "#0284c7", accent: "#38bdf8", glow: "rgba(2,132,199,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20l4-12h12l4 12H2z"/><path d="M12 8V4"/><path d="M8 20c0-2 1.5-4 4-4s4 2 4 4"/></svg>`,
    sections: [
      {
        title: "Cargo Classification",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
        questions: [
          { id: "cargo_type", label: "Cargo Type", type: "select", options: ["General Merchandise", "Bulk Commodity", "Refrigerated/Perishable", "Hazardous Goods", "Machinery & Equipment"], required: true },
          { id: "voyage_type", label: "Voyage Type", type: "select", options: ["Import", "Export", "Inland Transit", "Coastal"], required: true },
          { id: "packing", label: "Packing Standard", type: "select", options: ["Professional Packing", "Standard Packing", "Unpacked / Loose"], required: true },
        ],
      },
      {
        title: "Cover & Rates",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
        questions: [
          { id: "cover_clause", label: "Institute Cargo Clause", type: "select", options: ["ICC (A) – All Risks", "ICC (B) – Named Perils", "ICC (C) – Limited"], required: true },
          { id: "base_rate", label: "Base Rate (%‰)", type: "rate", unit: "‰", min: 0.05, max: 5, step: 0.01, required: true },
          { id: "war_rate", label: "War & SRCC Rate (%‰)", type: "rate", unit: "‰", min: 0, max: 2, step: 0.001 },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 50, required: true },
        ],
      },
      {
        title: "Survey & Loading",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
        questions: [
          { id: "survey_required_si", label: "Survey Required Above (ETB)", type: "number", unit: "ETB" },
          { id: "open_cover_discount", label: "Open Cover Discount (%)", type: "rate", unit: "%", min: 0, max: 20, step: 0.5 },
          { id: "season_loading", label: "Monsoon / Season Loading (%)", type: "rate", unit: "%", min: 0, max: 30, step: 1 },
        ],
      },
    ],
  },
  life: {
    name: "Life Insurance",
    description: "Configure mortality-based rate tables for all life products.",
    color: { from: "#4c1d95", to: "#7c3aed", accent: "#a78bfa", glow: "rgba(124,58,237,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    sections: [
      {
        title: "Product & Term",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        questions: [
          { id: "product_type", label: "Product Type", type: "select", options: ["Term Life", "Whole Life", "Endowment", "Credit Life", "Group Life"], required: true },
          { id: "term_years", label: "Policy Term (Years)", type: "select", options: ["5", "10", "15", "20", "25", "30", "Whole of Life"], required: true },
          { id: "payment_mode", label: "Premium Payment Mode", type: "select", options: ["Monthly", "Quarterly", "Semi-Annual", "Annual", "Single Premium"], required: true },
        ],
      },
      {
        title: "Mortality Rates by Age Band",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        questions: [
          { id: "mort_18_25", label: "Age 18–25 Mortality Rate (‰)", type: "rate", unit: "‰", min: 0, max: 5, step: 0.01, required: true, help: "Deaths per thousand per year." },
          { id: "mort_26_35", label: "Age 26–35 Mortality Rate (‰)", type: "rate", unit: "‰", min: 0, max: 8, step: 0.01, required: true },
          { id: "mort_36_45", label: "Age 36–45 Mortality Rate (‰)", type: "rate", unit: "‰", min: 0, max: 15, step: 0.01, required: true },
          { id: "mort_46_55", label: "Age 46–55 Mortality Rate (‰)", type: "rate", unit: "‰", min: 0, max: 30, step: 0.01, required: true },
          { id: "mort_56_65", label: "Age 56–65 Mortality Rate (‰)", type: "rate", unit: "‰", min: 0, max: 60, step: 0.01, required: true },
        ],
      },
      {
        title: "Loading Factors",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
        questions: [
          { id: "smoker_loading", label: "Smoker Loading (%)", type: "rate", unit: "%", min: 0, max: 100, step: 1 },
          { id: "female_discount", label: "Female Longevity Discount (%)", type: "rate", unit: "%", min: 0, max: 20, step: 0.5 },
          { id: "hazardous_occ", label: "Hazardous Occupation Loading (%)", type: "rate", unit: "%", min: 0, max: 150, step: 1 },
          { id: "medical_loading", label: "Impaired Life Loading (%)", type: "rate", unit: "%", min: 0, max: 200, step: 1 },
        ],
      },
      {
        title: "Benefit & Limits",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        questions: [
          { id: "min_sa", label: "Minimum Sum Assured (ETB)", type: "number", unit: "ETB", min: 10000 },
          { id: "max_sa", label: "Maximum Sum Assured (ETB)", type: "number", unit: "ETB" },
          { id: "free_cover_limit", label: "Group Free Cover Limit (ETB)", type: "number", unit: "ETB", help: "Above this, medical evidence required." },
        ],
      },
    ],
  },
  engineering: {
    name: "Engineering Insurance",
    description: "Rates for contractors all risk, erection and machinery breakdown.",
    color: { from: "#78350f", to: "#d97706", accent: "#fbbf24", glow: "rgba(217,119,6,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    sections: [
      {
        title: "Policy Class",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M2 22h20M8 22V11l4-5 4 5v11M12 6V2"/></svg>`,
        questions: [
          { id: "eng_class", label: "Engineering Class", type: "select", options: ["Contractors All Risk (CAR)", "Erection All Risk (EAR)", "Machinery Breakdown (MB)", "Electronic Equipment", "Contractors Plant & Machinery"], required: true },
          { id: "project_type", label: "Project / Risk Type", type: "select", options: ["Building Construction", "Civil Engineering", "Industrial Installation", "Power Plant", "Offshore"], required: true },
          { id: "project_duration", label: "Project Duration", type: "select", options: ["Up to 6 months", "6–12 months", "1–2 years", "2–3 years", "Over 3 years"], required: true },
        ],
      },
      {
        title: "Premium Rates",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        questions: [
          { id: "works_rate", label: "Works / Main Contract Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 5, step: 0.01, required: true },
          { id: "plant_rate", label: "Contractor's Plant Rate (%‰)", type: "rate", unit: "‰", min: 0.5, max: 10, step: 0.01 },
          { id: "tpl_rate", label: "Third-Party Liability Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 3, step: 0.01 },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 500, required: true },
        ],
      },
      {
        title: "Deductibles",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        questions: [
          { id: "material_excess", label: "Material Damage Deductible (ETB)", type: "number", unit: "ETB" },
          { id: "tpl_excess", label: "TPL Deductible (ETB)", type: "number", unit: "ETB" },
          { id: "nat_cat_excess", label: "Natural Catastrophe Deductible (%)", type: "rate", unit: "%", min: 0, max: 10, step: 0.5 },
        ],
      },
    ],
  },
  liability: {
    name: "Liability Insurance",
    description: "Public, employers and professional indemnity rate configuration.",
    color: { from: "#881337", to: "#e11d48", accent: "#fb7185", glow: "rgba(225,29,72,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    sections: [
      {
        title: "Liability Class",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
        questions: [
          { id: "liab_class", label: "Liability Class", type: "select", options: ["Public Liability", "Employers Liability", "Professional Indemnity", "Product Liability", "Directors & Officers"], required: true },
          { id: "business_type", label: "Business / Trade", type: "select", options: ["Retail / Shop", "Office / Professional", "Manufacturing", "Construction", "Healthcare", "Financial Services"], required: true },
          { id: "employees", label: "Number of Employees", type: "select", options: ["1–10", "11–50", "51–200", "201–500", "500+"], required: true },
        ],
      },
      {
        title: "Limits & Rates",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
        questions: [
          { id: "indemnity_limit", label: "Limit of Indemnity (ETB)", type: "number", unit: "ETB", required: true },
          { id: "base_rate", label: "Base Premium Rate (%‰ of Limit)", type: "rate", unit: "‰", min: 0.1, max: 10, step: 0.01, required: true },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 500, required: true },
          { id: "retro_date_discount", label: "Retroactive Date Discount (%)", type: "rate", unit: "%", min: 0, max: 15, step: 0.5 },
        ],
      },
      {
        title: "Loadings",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
        questions: [
          { id: "claims_loading", label: "Adverse Claims Loading (%)", type: "rate", unit: "%", min: 0, max: 100, step: 1 },
          { id: "high_risk_loading", label: "High-Risk Trade Loading (%)", type: "rate", unit: "%", min: 0, max: 75, step: 1 },
          { id: "excess_loading", label: "Lower Excess Loading (%)", type: "rate", unit: "%", min: 0, max: 30, step: 0.5 },
        ],
      },
    ],
  },
  burglary: {
    name: "Burglary & Theft",
    description: "Rates based on security grading, location risk and sum insured.",
    color: { from: "#134e4a", to: "#0d9488", accent: "#2dd4bf", glow: "rgba(13,148,136,0.2)" },
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    sections: [
      {
        title: "Risk Classification",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        questions: [
          { id: "premises_type", label: "Premises Type", type: "select", options: ["Residential", "Retail Shop", "Office", "Bank / Jeweller", "Warehouse"], required: true },
          { id: "security_grade", label: "Security Grading", type: "select", options: ["Grade A – CCTV + Guards + Alarm", "Grade B – Alarm + Guards", "Grade C – Alarm Only", "Grade D – Locks Only", "No Security"], required: true },
          { id: "location_risk", label: "Location Risk", type: "select", options: ["Low Risk Zone", "Medium Risk Zone", "High Risk Zone", "Very High Risk Zone"], required: true },
        ],
      },
      {
        title: "Premium Rates",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        questions: [
          { id: "base_rate", label: "Base Rate (%‰ of Sum Insured)", type: "rate", unit: "‰", min: 0.1, max: 10, step: 0.01, required: true },
          { id: "cash_in_safe_rate", label: "Cash in Safe Rate (%‰)", type: "rate", unit: "‰", min: 0.5, max: 15, step: 0.01 },
          { id: "cash_in_transit_rate", label: "Cash in Transit Rate (%‰)", type: "rate", unit: "‰", min: 0.5, max: 20, step: 0.01 },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 200, required: true },
        ],
      },
      {
        title: "Discounts & Loading",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`,
        questions: [
          { id: "cctv_discount", label: "CCTV Discount (%)", type: "rate", unit: "%", min: 0, max: 15, step: 0.5 },
          { id: "guard_discount", label: "Security Guard Discount (%)", type: "rate", unit: "%", min: 0, max: 20, step: 0.5 },
          { id: "claim_loading", label: "Prior Loss Loading (%)", type: "rate", unit: "%", min: 0, max: 50, step: 1 },
        ],
      },
    ],
  },
};

// ── Active type ────────────────────────────────────────────────────────────
const typeId   = computed(() => route.params.typeId);
const typeDef  = computed(() => TYPES[typeId.value]);

// ── Form state ─────────────────────────────────────────────────────────────
const form     = ref({});
const saving   = ref(false);
const saved    = ref(false);
const publishing = ref(false);
const published  = ref(false);
const currentRateUuid = ref(null);
const currentStatus = ref('DRAFT');
const errors   = ref({});

import { saveRateConfig, publishRateConfig, fetchRateConfigs } from '@/features/shared/form_builder/api/formBuilderApi';
import { onMounted } from 'vue';

onMounted(async () => {
  if (!typeId.value) return;
  try {
    const list = await fetchRateConfigs(typeId.value);
    if (list && list.length) {
      const active = list[0];
      currentRateUuid.value = active.rateUuid;
      currentStatus.value = active.status;
      if (active.ratesJson) {
        try {
          form.value = typeof active.ratesJson === 'string' ? JSON.parse(active.ratesJson) : active.ratesJson;
        } catch (e) {
          console.error('Parse ratesJson error:', e);
        }
      }
    }
  } catch (e) {
    console.error('Failed to load rate config:', e);
  }
});

function validate() {
  errors.value = {};
  if (!typeDef.value) return false;
  for (const sec of typeDef.value.sections) {
    for (const q of sec.questions) {
      if (q.required && (form.value[q.id] === undefined || form.value[q.id] === "" || form.value[q.id] === null)) {
        errors.value[q.id] = "This field is required.";
      }
    }
  }
  return Object.keys(errors.value).length === 0;
}

async function save() {
  if (!validate()) return;
  saving.value = true;
  try {
    const savedObj = await saveRateConfig({
      rateUuid: currentRateUuid.value,
      productId: typeId.value,
      version: '1.0',
      ratesJson: JSON.stringify(form.value, null, 2),
    });
    if (savedObj && savedObj.rateUuid) {
      currentRateUuid.value = savedObj.rateUuid;
    }
    saving.value = false;
    saved.value  = true;
    setTimeout(() => (saved.value = false), 3000);
  } catch (e) {
    saving.value = false;
    alert('Save failed: ' + e.message);
  }
}

async function publish() {
  if (!validate()) return;
  publishing.value = true;
  try {
    if (!currentRateUuid.value) {
      await save();
    }
    const pubObj = await publishRateConfig(currentRateUuid.value);
    if (pubObj) {
      currentStatus.value = pubObj.status;
    }
    publishing.value = false;
    published.value = true;
    setTimeout(() => (published.value = false), 3000);
  } catch (e) {
    publishing.value = false;
    alert('Publish failed: ' + e.message);
  }
}

function reset() {
  form.value   = {};
  errors.value = {};
}

function goBack() {
  if (window.history.state && window.history.state.back) {
    router.back();
  } else {
    router.push(`/${typeId.value}/dashboard`);
  }
}

const activeSection = ref(0);
</script>

<template>
  <div
    class="rf-root"
    v-if="typeDef"
    :style="{
      '--prod-from': typeDef.color.from,
      '--prod-to': typeDef.color.to,
      '--prod-accent': typeDef.color.accent,
      '--prod-glow': typeDef.color.glow
    }"
  >

    <!-- ── Top bar ── -->
    <div class="rf-topbar">
      <button class="rf-back" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
        Back
      </button>

      <div class="rf-breadcrumb">
        <span class="rf-bc-current">{{ typeDef.name }} Rate Configuration</span>
      </div>

      <div class="rf-topbar-actions">
        <button class="rf-btn-ghost" @click="reset">Reset</button>
        <button class="rf-btn-save" :class="{ 'rf-btn-saving': saving, 'rf-btn-saved': saved }" @click="save" :disabled="saving">
          <template v-if="saving">
            <svg class="rf-spin w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Saving…
          </template>
          <template v-else-if="saved">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Saved!
          </template>
          <template v-else>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            Save Draft
          </template>
        </button>

        <button class="rf-btn-publish" @click="publish" :disabled="publishing">
          <template v-if="publishing">Publishing…</template>
          <template v-else-if="published">Published!</template>
          <template v-else>Publish Rates</template>
        </button>
      </div>
    </div>

    <!-- ── Header Banner Card ── -->
    <div class="rf-header-card">
      <div class="rf-header-main">
        <div class="rf-header-icon" v-html="typeDef.icon"></div>
        <div class="rf-header-text">
          <h1 class="rf-header-title">{{ typeDef.name }}</h1>
          <p class="rf-header-desc">{{ typeDef.description }}</p>
        </div>
      </div>
      <div class="rf-header-meta">
        <div class="rf-meta-pill">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          {{ typeDef.sections.length }} sections
        </div>
        <div class="rf-meta-pill">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ typeDef.sections.reduce((a, s) => a + s.questions.length, 0) }} parameters
        </div>
      </div>
    </div>

    <!-- ── Body: sidebar nav + form ── -->
    <div class="rf-body">

      <!-- Section nav sidebar -->
      <aside class="rf-sidebar">
        <p class="rf-sidebar-label">Navigation</p>
        <button
          v-for="(sec, i) in typeDef.sections"
          :key="i"
          class="rf-sec-btn"
          :class="{ 'rf-sec-active': activeSection === i }"
          @click="activeSection = i"
        >
          <span class="rf-sec-icon" v-html="sec.icon"></span>
          <span>{{ sec.title }}</span>
        </button>

        <!-- completion indicator -->
        <div class="rf-progress-wrap">
          <div class="rf-progress-label">
            <span>Completion</span>
            <span>{{ Math.round((Object.keys(form).filter(k => form[k] !== '' && form[k] !== undefined && form[k] !== null).length / Math.max(1, typeDef.sections.reduce((a,s) => a+s.questions.filter(q=>q.required).length,0))) * 100) }}%</span>
          </div>
          <div class="rf-progress-bar">
            <div class="rf-progress-fill"
              :style="`width: ${Math.min(100,Math.round((Object.keys(form).filter(k => form[k] !== '' && form[k] !== undefined && form[k] !== null).length / Math.max(1,typeDef.sections.reduce((a,s) => a+s.questions.filter(q=>q.required).length,0))) * 100))}%;`">
            </div>
          </div>
        </div>
      </aside>

      <!-- Form panel -->
      <main class="rf-form-panel">
        <div
          v-for="(section, si) in typeDef.sections"
          :key="si"
          v-show="activeSection === si"
          class="rf-section"
        >
          <div class="rf-section-header">
            <span class="rf-section-icon-badge" v-html="section.icon"></span>
            <div>
              <h2 class="rf-section-title">{{ section.title }}</h2>
              <p class="rf-section-count">{{ section.questions.length }} parameters configured</p>
            </div>
          </div>

          <div class="rf-fields">
            <!-- ── select ── -->
            <template v-for="q in section.questions" :key="q.id">
              <div
                class="rf-field"
                :class="{ 'rf-field-rate': q.type === 'rate' }"
              >
                <CustomSelect
                  v-if="q.type === 'select'"
                  :name="q.id"
                  :label="q.label + (q.required ? ' *' : '')"
                  :options="q.options"
                  v-model="form[q.id]"
                  :attributes="{ placeholder: '— Choose —' }"
                />

                <!-- rate (slider + value badge) -->
                <div v-else-if="q.type === 'rate'" class="rf-rate-field">
                  <div class="rf-rate-label">
                    <span class="rf-rate-label-text">{{ q.label }}<span v-if="q.required" class="rf-required"> *</span></span>
                    <span v-if="q.unit" class="rf-unit-badge">{{ q.unit }}</span>
                  </div>
                  <div class="rf-slider-row">
                    <input
                      type="range"
                      class="rf-slider"
                      :min="q.min ?? 0"
                      :max="q.max ?? 100"
                      :step="q.step ?? 0.01"
                      v-model.number="form[q.id]"
                      :style="`--pct:${Math.round(((form[q.id]||q.min||0)-(q.min||0))/((q.max||100)-(q.min||0))*100)}%`"
                    />
                    <div class="rf-slider-val">
                      {{ (form[q.id] ?? q.min ?? 0).toFixed(2) }}<span class="rf-val-unit">{{ q.unit }}</span>
                    </div>
                  </div>
                  <p v-if="q.help" class="rf-help">{{ q.help }}</p>
                  <!-- savings badge -->
                  <div v-if="(q.label.toLowerCase().includes('discount') || q.label.toLowerCase().includes('bonus')) && (form[q.id] ?? 0) > 0" class="rf-savings-badge">
                    <span class="rf-savings-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </span>
                    <div>
                      <span class="rf-savings-headline">Saves {{ (form[q.id] ?? 0).toFixed(1) }}% off premium</span>
                      <span class="rf-savings-example">e.g. ETB 10,000 base → customer pays ETB {{ (10000 - (form[q.id] ?? 0) * 100).toLocaleString() }}</span>
                    </div>
                  </div>
                  <div v-else-if="q.label.toLowerCase().includes('loading') && (form[q.id] ?? 0) > 0" class="rf-loading-badge">
                    <span class="rf-loading-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </span>
                    <span>Adds {{ (form[q.id] ?? 0).toFixed(1) }}% → ETB {{ (10000 + (form[q.id] ?? 0) * 100).toLocaleString() }} on ETB 10k base</span>
                  </div>
                </div>

                <!-- plain number -->
                <CustomInput
                  v-else-if="q.type === 'number'"
                  :name="q.id"
                  :label="q.label + (q.required ? ' *' : '')"
                  v-model="form[q.id]"
                  :attributes="{
                    type: 'number',
                    placeholder: 'Enter value…',
                    min: q.min ?? 0,
                    step: q.unit === 'ETB' ? 100 : 1
                  }"
                >
                  <template v-if="q.unit" #left>
                    <span class="rf-prefix">{{ q.unit }}</span>
                  </template>
                </CustomInput>
              </div>
            </template>
          </div>

          <!-- Discount preview panel -->
          <div
            v-if="section.questions.some(q => (q.label.toLowerCase().includes('discount') || q.label.toLowerCase().includes('bonus')) && form[q.id] > 0)"
            class="rf-preview-panel"
          >
            <div class="rf-preview-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Customer Savings Preview
            </div>
            <div class="rf-preview-body">
              <div class="rf-preview-example">
                <span class="rf-preview-label">Sample Base Premium</span>
                <span class="rf-preview-val">ETB 10,000</span>
              </div>
              <template v-for="q in section.questions.filter(q2 => (q2.label.toLowerCase().includes('discount')||q2.label.toLowerCase().includes('bonus')) && form[q2.id] > 0)" :key="q.id">
                <div class="rf-preview-row">
                  <span class="rf-preview-disc-label">{{ q.label.replace(/ \(%\)/,'').replace(/ \(%‰\)/,'') }}</span>
                  <span class="rf-preview-disc-val">−{{ (form[q.id]).toFixed(1) }}% → −ETB {{ ((form[q.id]/100)*10000).toLocaleString() }}</span>
                </div>
              </template>
              <div class="rf-preview-total">
                <span>Total Discount</span>
                <span class="rf-preview-total-val">
                  −{{ section.questions.filter(q2 => (q2.label.toLowerCase().includes('discount')||q2.label.toLowerCase().includes('bonus')) && form[q2.id]>0).reduce((s,q2)=>s+(form[q2.id]||0),0).toFixed(1) }}%
                  &nbsp;→&nbsp;
                  ETB {{ (10000 - section.questions.filter(q2=>(q2.label.toLowerCase().includes('discount')||q2.label.toLowerCase().includes('bonus'))&&form[q2.id]>0).reduce((s,q2)=>s+(form[q2.id]||0)/100*10000,0)).toLocaleString() }}
                </span>
              </div>
              <p class="rf-preview-note">* Illustrative only — based on an ETB 10,000 sample premium</p>
            </div>
          </div>

          <!-- Next/Prev buttons -->
          <div class="rf-section-nav">
            <button v-if="si > 0" class="rf-btn-ghost" @click="activeSection = si - 1">
              ← Previous
            </button>
            <button v-if="si < typeDef.sections.length - 1" class="rf-btn-next" @click="activeSection = si + 1">
              Next Section →
            </button>
            <button v-else class="rf-btn-next" @click="save" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save All Rates' }}
            </button>
          </div>
        </div>
      </main>
    </div>

  </div>

  <!-- Fallback for unknown type -->
  <div v-else class="rf-not-found">
    <p>Insurance type <strong>{{ typeId }}</strong> not found.</p>
    <button class="rf-btn-ghost" @click="goBack">← Back</button>
  </div>
</template>

<style scoped>
.rf-root, .rf-root * {
  box-sizing: border-box;
}

.rf-root {
  min-height: 100vh;
  background: rgb(var(--surface-muted));
  display: flex;
  flex-direction: column;
  font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
}

/* ── Top bar ── */
.rf-topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.75rem;
  background: rgb(var(--surface));
  border-bottom: 1px solid rgb(var(--line));
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.rf-back {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.85rem; font-weight: 700; color: rgb(var(--ink-muted));
  background: rgb(var(--surface-raised)); border: 1px solid rgb(var(--line)); cursor: pointer;
  padding: 0.4rem 0.75rem; border-radius: 8px;
  transition: all 0.18s ease;
}
.rf-back:hover { background: var(--tint-e2e8f0, #e2e8f0); color: rgb(var(--ink)); }
.rf-breadcrumb { display: flex; align-items: center; gap: 0.375rem; }
.rf-bc-current { font-size: 0.9rem; font-weight: 800; color: rgb(var(--ink)); letter-spacing: -0.01em; }
.rf-topbar-actions { display: flex; align-items: center; gap: 0.625rem; margin-left: auto; }

/* ── Buttons ── */
.rf-btn-ghost {
  padding: 0.45rem 1rem; border-radius: 8px;
  border: 1px solid rgb(var(--line-strong)); background: rgb(var(--surface));
  font-size: 0.82rem; font-weight: 600; color: rgb(var(--ink-muted));
  cursor: pointer; transition: all 0.18s ease;
}
.rf-btn-ghost:hover { background: rgb(var(--surface-raised)); color: rgb(var(--ink)); border-color: #94a3b8; }

.rf-btn-save {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 1.2rem; border-radius: 8px;
  border: 1px solid rgb(var(--line-strong)); background: rgb(var(--surface));
  font-size: 0.82rem; font-weight: 700; color: rgb(var(--ink));
  cursor: pointer; transition: all 0.18s ease;
}
.rf-btn-save:hover { background: rgb(var(--surface-muted)); border-color: #94a3b8; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
.rf-btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
.rf-btn-saving { background: #94a3b8 !important; color: #fff !important; }
.rf-btn-saved  { background: #10b981 !important; color: #fff !important; border-color: #10b981 !important; }

.rf-btn-publish {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 1.25rem; border-radius: 8px;
  border: 1px solid var(--prod-accent, #FE9312);
  background: linear-gradient(135deg, var(--prod-from, #022B54), var(--prod-to, #03396C));
  font-size: 0.82rem; font-weight: 700; color: #ffffff;
  cursor: pointer; transition: all 0.2s ease;
  box-shadow: 0 2px 10px var(--prod-glow, rgba(84,18,22,0.25));
}
.rf-btn-publish:hover { filter: brightness(1.1); box-shadow: 0 4px 16px var(--prod-glow, rgba(84,18,22,0.35)); transform: translateY(-1px); }
.rf-btn-publish:disabled { opacity: 0.7; cursor: not-allowed; }

.rf-spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Clean Header Card ── */
.rf-header-card {
  margin: 1.25rem 1.75rem 0.5rem;
  padding: 1.25rem 1.5rem;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--line));
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
}
.rf-header-main { display: flex; align-items: center; gap: 1rem; }
.rf-header-icon {
  width: 3rem; height: 3rem; border-radius: 12px;
  background: linear-gradient(135deg, var(--prod-from, #022B54), var(--prod-to, #03396C));
  border: 1.5px solid var(--prod-accent, #FE9312);
  color: #ffffff; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 4px 14px var(--prod-glow, rgba(84,18,22,0.2));
}
.rf-header-icon :deep(svg) { width: 1.5rem; height: 1.5rem; }
.rf-header-text { display: flex; flex-direction: column; gap: 0.15rem; }
.rf-header-title { font-size: 1.25rem; font-weight: 800; color: rgb(var(--ink)); letter-spacing: -0.02em; }
.rf-header-desc { font-size: 0.82rem; color: rgb(var(--ink-subtle)); font-weight: 500; }

.rf-header-meta { display: flex; align-items: center; gap: 0.6rem; }
.rf-meta-pill {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.85rem; border-radius: 99px;
  background: rgb(var(--surface-raised)); border: 1px solid rgb(var(--line));
  font-size: 0.78rem; font-weight: 700; color: rgb(var(--ink-muted));
}

/* ── Body layout ── */
.rf-body {
  display: flex;
  flex: 1;
  padding: 0.75rem 1.75rem 1.75rem;
  gap: 1.25rem;
}

/* ── Sidebar Nav ── */
.rf-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--line));
  border-radius: 16px;
  padding: 1.25rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  height: fit-content;
  box-sizing: border-box;
  overflow: hidden;
}
.rf-sidebar-label {
  font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.12em; color: rgb(var(--ink-subtle)); margin-bottom: 0.4rem;
  padding: 0 0.5rem;
}
.rf-sec-btn {
  display: flex; align-items: center; gap: 0.65rem;
  width: 100%; padding: 0.65rem 0.75rem;
  border-radius: 10px; border: 1px solid transparent;
  background: transparent; text-align: left;
  font-size: 0.85rem; font-weight: 600; color: rgb(var(--ink-muted));
  cursor: pointer; transition: all 0.18s ease;
  box-sizing: border-box;
  overflow: hidden;
}
.rf-sec-btn span:last-child {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rf-sec-btn:hover { background: rgb(var(--surface-raised)); color: rgb(var(--ink)); }
.rf-sec-active {
  background: linear-gradient(135deg, var(--prod-from, #022B54), var(--prod-to, #03396C)) !important;
  color: #ffffff !important;
  border-color: transparent !important;
  font-weight: 700;
  box-shadow: 0 3px 10px var(--prod-glow, rgba(84, 18, 22, 0.2));
}
.rf-sec-icon {
  display: flex; align-items: center; justify-content: center;
  width: 1.25rem; height: 1.25rem; flex-shrink: 0;
  color: inherit;
}
.rf-sec-active .rf-sec-icon { color: #ffffff; }

.rf-progress-wrap { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgb(var(--line)); }
.rf-progress-label {
  display: flex; justify-content: space-between;
  font-size: 0.75rem; font-weight: 700; color: rgb(var(--ink-subtle));
  margin-bottom: 0.4rem;
}
.rf-progress-bar {
  height: 6px; border-radius: 99px; background: var(--tint-e2e8f0, #e2e8f0); overflow: hidden;
}
.rf-progress-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--prod-from, #022B54), var(--prod-to, #03396C));
  transition: width 0.3s ease;
}

/* ── Form panel ── */
.rf-form-panel {
  flex: 1;
  min-width: 0;
}

.rf-section {
  background: rgb(var(--surface));
  border-radius: 16px;
  border: 1px solid rgb(var(--line));
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  padding: 1.75rem;
}

.rf-section-header {
  display: flex; align-items: center; gap: 0.85rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgb(var(--line));
}
.rf-section-icon-badge {
  width: 2.25rem; height: 2.25rem; border-radius: 10px;
  background: color-mix(in srgb, var(--prod-to, #022B54) 12%, rgb(var(--surface)));
  color: var(--prod-to, var(--shade-022b54, #022B54));
  border: 1px solid color-mix(in srgb, var(--prod-to, #022B54) 20%, transparent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rf-section-icon-badge :deep(svg) { width: 1.25rem; height: 1.25rem; }
.rf-section-title {
  font-size: 1.1rem; font-weight: 800; color: rgb(var(--ink));
  letter-spacing: -0.01em;
}
.rf-section-count {
  font-size: 0.78rem; color: rgb(var(--ink-subtle)); margin-top: 0.1rem; font-weight: 500;
}

/* ── Fields grid ── */
.rf-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 1.75rem;
  align-items: start;
}
@media (max-width: 860px) { .rf-fields { grid-template-columns: 1fr; } }

.rf-field { display: contents; }
.rf-field.rf-field-rate { display: block; grid-column: 1 / -1; }

/* ── High-Contrast Form Field Typography & Color System ── */
:deep(label) {
  font-size: 0.83rem !important;
  font-weight: 700 !important;
  color: rgb(var(--ink)) !important;
  letter-spacing: -0.01em !important;
  line-height: 1.3 !important;
  margin-bottom: 0.3rem !important;
}

:deep(select.custom-input),
:deep(input.custom-input) {
  font-size: 0.88rem !important;
  font-weight: 600 !important;
  color: rgb(var(--ink)) !important;
  font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif !important;
}

:deep(select.custom-input option) {
  font-size: 0.88rem !important;
  font-weight: 500 !important;
  color: rgb(var(--ink)) !important;
  background: rgb(var(--surface)) !important;
}

:deep(select.custom-input option[disabled]) {
  color: rgb(var(--ink-subtle)) !important;
  font-weight: 400 !important;
}

:deep(input.custom-input::placeholder) {
  color: rgb(var(--ink-subtle)) !important;
  font-weight: 400 !important;
}

:deep(.relative.flex.items-center.max-w-full.rounded-lg.border),
:deep(.relative.flex.items-center.rounded-lg.border) {
  border-color: rgb(var(--line-strong)) !important;
  background-color: rgb(var(--surface)) !important;
  border-radius: 10px !important;
  transition: all 0.18s ease !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
}

:deep(.relative.flex.items-center.max-w-full.rounded-lg.border:hover),
:deep(.relative.flex.items-center.rounded-lg.border:hover) {
  border-color: #94a3b8 !important;
}

:deep(.relative.flex.items-center.max-w-full.rounded-lg.border:focus-within),
:deep(.relative.flex.items-center.rounded-lg.border:focus-within) {
  border-color: var(--prod-to, #2563eb) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--prod-to, #2563eb) 18%, transparent) !important;
}

.rf-prefix {
  display: flex; align-items: center;
  padding: 0 0.625rem 0 0.875rem;
  font-size: 0.78rem; font-weight: 700; color: rgb(var(--ink-muted));
  border-right: 1px solid rgb(var(--line));
  height: 100%; white-space: nowrap;
  user-select: none;
}

.rf-required { color: #ef4444 !important; font-weight: 700; }
.rf-unit-badge {
  font-size: 0.68rem; font-weight: 800; text-transform: uppercase;
  padding: 0.15rem 0.55rem; border-radius: 99px;
  background: rgb(var(--surface-raised)); color: rgb(var(--ink-muted)); letter-spacing: 0.05em;
  flex-shrink: 0; border: 1px solid rgb(var(--line-strong));
}
.rf-help {
  font-size: 0.73rem; color: rgb(var(--ink-subtle)); font-weight: 500;
  line-height: 1.45; margin-top: 0.35rem;
}

/* ── Rate field wrapper ── */
.rf-rate-field {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1.1rem 1.25rem;
  background: rgb(var(--surface-muted));
  border: 1px solid rgb(var(--line));
  border-radius: 12px;
}
.rf-rate-label {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.rf-rate-label-text {
  font-size: 0.85rem; font-weight: 700; color: rgb(var(--ink));
}

.rf-slider-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.rf-slider {
  flex: 1;
  min-width: 0;
  -webkit-appearance: none; appearance: none;
  height: 6px; border-radius: 99px;
  background: linear-gradient(
    to right,
    var(--prod-to, #022B54) var(--pct, 0%),
    #cbd5e1 var(--pct, 0%)
  );
  outline: none; cursor: pointer;
}
.rf-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--prod-to, #022B54);
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px var(--prod-to, #022B54), 0 2px 6px rgba(0,0,0,0.15);
  cursor: pointer;
}
.rf-slider::-moz-range-thumb {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--prod-to, #022B54);
  border: 2px solid #ffffff;
  cursor: pointer;
}

.rf-slider-val {
  flex-shrink: 0;
  min-width: 5.5rem;
  text-align: center;
  padding: 0.4rem 0.75rem;
  border: 1.5px solid color-mix(in srgb, var(--prod-to, #022B54) 35%, rgb(var(--line-strong)));
  border-radius: 8px;
  background: rgb(var(--surface));
  font-size: 0.95rem; font-weight: 800;
  color: var(--prod-to, rgb(var(--ink)));
  display: flex; align-items: baseline; justify-content: center; gap: 0.2rem;
}
.rf-val-unit { font-size: 0.65rem; font-weight: 700; opacity: 0.7; }

/* Badges */
.rf-savings-badge {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--tint-f0fdf4, #f0fdf4);
  border: 1px solid var(--tint-bbf7d0, #bbf7d0);
  border-radius: 8px;
}
.rf-savings-icon { font-size: 1rem; flex-shrink: 0; color: #16a34a; }
.rf-savings-headline { display: block; font-size: 0.78rem; font-weight: 700; color: var(--shade-15803d, #15803d); }
.rf-savings-example { display: block; font-size: 0.7rem; color: #16a34a; margin-top: 0.1rem; }

.rf-loading-badge {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  background: var(--tint-fff7ed, #fff7ed);
  border: 1px solid var(--tint-fed7aa, #fed7aa);
  border-radius: 8px;
  font-size: 0.75rem; font-weight: 600; color: #c2410c;
}

/* Discount preview panel */
.rf-preview-panel {
  margin-top: 1.5rem;
  border: 1px solid rgb(var(--line));
  border-radius: 12px;
  background: rgb(var(--surface-muted));
  overflow: hidden;
}
.rf-preview-header {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.82rem; font-weight: 800; color: var(--prod-to, rgb(var(--ink)));
  border-bottom: 1px solid rgb(var(--line));
  background: rgb(var(--surface));
}
.rf-preview-body {
  padding: 1rem;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.rf-preview-example {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed rgb(var(--line-strong));
}
.rf-preview-label { font-size: 0.75rem; font-weight: 600; color: rgb(var(--ink-subtle)); }
.rf-preview-val   { font-size: 0.85rem; font-weight: 800; color: rgb(var(--ink)); }
.rf-preview-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; }
.rf-preview-disc-label { color: rgb(var(--ink-muted)); font-weight: 500; }
.rf-preview-disc-val   { font-weight: 700; color: #16a34a; }
.rf-preview-total {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 0.5rem;
  border-top: 2px solid rgb(var(--line));
  font-size: 0.82rem; font-weight: 700; color: rgb(var(--ink));
}
.rf-preview-total-val { font-weight: 800; font-size: 0.88rem; color: #16a34a; }
.rf-preview-note { font-size: 0.68rem; color: rgb(var(--ink-subtle)); font-style: italic; }

/* Section nav */
.rf-section-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1.75rem; padding-top: 1.25rem;
  border-top: 1px solid rgb(var(--line));
}
.rf-btn-next {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.55rem 1.5rem; border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, var(--prod-from, #022B54), var(--prod-to, #03396C));
  color: #ffffff;
  font-size: 0.82rem; font-weight: 700;
  cursor: pointer; transition: all 0.18s ease;
  box-shadow: 0 3px 12px var(--prod-glow, rgba(84, 18, 22, 0.2));
}
.rf-btn-next:hover { filter: brightness(1.1); transform: translateY(-1px); }
.rf-btn-next:disabled { opacity: 0.7; cursor: not-allowed; }

.rf-not-found {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem;
  min-height: 60vh; font-size: 1rem; color: rgb(var(--ink-subtle));
}

@media (max-width: 768px) {
  .rf-body { flex-direction: column; }
  .rf-sidebar { width: 100%; }
}
</style>
