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
        icon: "🚗",
        questions: [
          { id: "vehicle_type", label: "Vehicle Type", type: "select", options: ["Private Car", "Commercial Vehicle", "Motorcycle", "Minibus", "Heavy Truck"], required: true, help: "Category determines the base rate schedule." },
          { id: "vehicle_use", label: "Primary Use", type: "select", options: ["Personal", "Business", "Hire/Reward", "Government"], required: true },
          { id: "engine_cc", label: "Engine Capacity (CC)", type: "select", options: ["Up to 1000cc", "1001–1500cc", "1501–2000cc", "2001–3000cc", "Over 3000cc"], required: true },
          { id: "vehicle_age", label: "Vehicle Age", type: "select", options: ["Brand New (0 yr)", "1–3 Years", "4–6 Years", "7–10 Years", "Over 10 Years"], required: true },
        ],
      },
      {
        title: "Cover & Premium Rates",
        icon: "📊",
        questions: [
          { id: "cover_type", label: "Cover Type", type: "select", options: ["Comprehensive", "Third Party Only", "Third Party Fire & Theft"], required: true },
          { id: "base_rate", label: "Base Premium Rate (%)", type: "rate", unit: "%", min: 0.5, max: 10, step: 0.01, required: true, help: "Percentage of vehicle sum insured." },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 100, required: true },
          { id: "max_premium", label: "Maximum Premium (ETB)", type: "number", unit: "ETB", min: 1000, required: false },
        ],
      },
      {
        title: "Loading & Discount Factors",
        icon: "⚖️",
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
        icon: "🛡️",
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
        icon: "🏢",
        questions: [
          { id: "property_type", label: "Property Type", type: "select", options: ["Residential Building", "Commercial Building", "Industrial/Factory", "Warehouse", "Mixed Use"], required: true },
          { id: "construction", label: "Construction Type", type: "select", options: ["Fire-Resistant (Class A)", "Semi Fire-Resistant (Class B)", "Combustible (Class C)", "Non-Standard"], required: true, help: "Determines structural fire resistance rating." },
          { id: "occupancy", label: "Occupancy / Use", type: "select", options: ["Owner Occupied", "Tenanted – Office", "Tenanted – Retail", "Tenanted – Warehouse", "Vacant"], required: true },
          { id: "stories", label: "Number of Storeys", type: "select", options: ["1", "2–3", "4–6", "7–10", "Above 10"], required: true },
        ],
      },
      {
        title: "Premium Rates",
        icon: "💰",
        questions: [
          { id: "base_rate_building", label: "Building Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 5, step: 0.01, required: true, help: "Rate per thousand of sum insured." },
          { id: "base_rate_contents", label: "Contents Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 5, step: 0.01, required: true },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 100, required: true },
          { id: "max_si", label: "Maximum Sum Insured per Risk (ETB)", type: "number", unit: "ETB", min: 0 },
        ],
      },
      {
        title: "Loading Factors",
        icon: "⚖️",
        questions: [
          { id: "sprinkler_discount", label: "Sprinkler System Discount (%)", type: "rate", unit: "%", min: 0, max: 25, step: 0.5 },
          { id: "fire_alarm_discount", label: "Fire Alarm Discount (%)", type: "rate", unit: "%", min: 0, max: 15, step: 0.5 },
          { id: "hazardous_loading", label: "Hazardous Occupancy Loading (%)", type: "rate", unit: "%", min: 0, max: 100, step: 1 },
          { id: "claims_loading", label: "Claims History Loading (%)", type: "rate", unit: "%", min: 0, max: 50, step: 0.5 },
        ],
      },
      {
        title: "Allied Perils Extension",
        icon: "🌪️",
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
        icon: "🏥",
        questions: [
          { id: "plan_type", label: "Plan Type", type: "select", options: ["Individual", "Family (2 adults)", "Family Plus (2+children)", "Group (SME)", "Group (Corporate)"], required: true },
          { id: "cover_level", label: "Cover Level", type: "select", options: ["Basic / Essential", "Standard", "Enhanced", "Premium / Executive"], required: true },
          { id: "inpatient_limit", label: "Annual Inpatient Limit (ETB)", type: "number", unit: "ETB", required: true },
          { id: "outpatient_limit", label: "Annual Outpatient Limit (ETB)", type: "number", unit: "ETB", required: true },
        ],
      },
      {
        title: "Age Band Premiums",
        icon: "📅",
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
        icon: "🧾",
        questions: [
          { id: "annual_deductible", label: "Annual Deductible (ETB)", type: "number", unit: "ETB" },
          { id: "copay_gp", label: "Co-pay – GP Visit (%)", type: "rate", unit: "%", min: 0, max: 30, step: 1 },
          { id: "copay_specialist", label: "Co-pay – Specialist (%)", type: "rate", unit: "%", min: 0, max: 30, step: 1 },
          { id: "copay_hospital", label: "Co-pay – Hospitalisation (%)", type: "rate", unit: "%", min: 0, max: 20, step: 1 },
        ],
      },
      {
        title: "Loading & Discounts",
        icon: "⚖️",
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
        icon: "📦",
        questions: [
          { id: "cargo_type", label: "Cargo Type", type: "select", options: ["General Merchandise", "Bulk Commodity", "Refrigerated/Perishable", "Hazardous Goods", "Machinery & Equipment"], required: true },
          { id: "voyage_type", label: "Voyage Type", type: "select", options: ["Import", "Export", "Inland Transit", "Coastal"], required: true },
          { id: "packing", label: "Packing Standard", type: "select", options: ["Professional Packing", "Standard Packing", "Unpacked / Loose"], required: true },
        ],
      },
      {
        title: "Cover & Rates",
        icon: "📋",
        questions: [
          { id: "cover_clause", label: "Institute Cargo Clause", type: "select", options: ["ICC (A) – All Risks", "ICC (B) – Named Perils", "ICC (C) – Limited"], required: true },
          { id: "base_rate", label: "Base Rate (%‰)", type: "rate", unit: "‰", min: 0.05, max: 5, step: 0.01, required: true },
          { id: "war_rate", label: "War & SRCC Rate (%‰)", type: "rate", unit: "‰", min: 0, max: 2, step: 0.001 },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 50, required: true },
        ],
      },
      {
        title: "Survey & Loading",
        icon: "🔍",
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
        icon: "📜",
        questions: [
          { id: "product_type", label: "Product Type", type: "select", options: ["Term Life", "Whole Life", "Endowment", "Credit Life", "Group Life"], required: true },
          { id: "term_years", label: "Policy Term (Years)", type: "select", options: ["5", "10", "15", "20", "25", "30", "Whole of Life"], required: true },
          { id: "payment_mode", label: "Premium Payment Mode", type: "select", options: ["Monthly", "Quarterly", "Semi-Annual", "Annual", "Single Premium"], required: true },
        ],
      },
      {
        title: "Mortality Rates by Age Band",
        icon: "📊",
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
        icon: "⚖️",
        questions: [
          { id: "smoker_loading", label: "Smoker Loading (%)", type: "rate", unit: "%", min: 0, max: 100, step: 1 },
          { id: "female_discount", label: "Female Longevity Discount (%)", type: "rate", unit: "%", min: 0, max: 20, step: 0.5 },
          { id: "hazardous_occ", label: "Hazardous Occupation Loading (%)", type: "rate", unit: "%", min: 0, max: 150, step: 1 },
          { id: "medical_loading", label: "Impaired Life Loading (%)", type: "rate", unit: "%", min: 0, max: 200, step: 1 },
        ],
      },
      {
        title: "Benefit & Limits",
        icon: "💼",
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
        icon: "🏗️",
        questions: [
          { id: "eng_class", label: "Engineering Class", type: "select", options: ["Contractors All Risk (CAR)", "Erection All Risk (EAR)", "Machinery Breakdown (MB)", "Electronic Equipment", "Contractors Plant & Machinery"], required: true },
          { id: "project_type", label: "Project / Risk Type", type: "select", options: ["Building Construction", "Civil Engineering", "Industrial Installation", "Power Plant", "Offshore"], required: true },
          { id: "project_duration", label: "Project Duration", type: "select", options: ["Up to 6 months", "6–12 months", "1–2 years", "2–3 years", "Over 3 years"], required: true },
        ],
      },
      {
        title: "Premium Rates",
        icon: "💰",
        questions: [
          { id: "works_rate", label: "Works / Main Contract Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 5, step: 0.01, required: true },
          { id: "plant_rate", label: "Contractor's Plant Rate (%‰)", type: "rate", unit: "‰", min: 0.5, max: 10, step: 0.01 },
          { id: "tpl_rate", label: "Third-Party Liability Rate (%‰)", type: "rate", unit: "‰", min: 0.1, max: 3, step: 0.01 },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 500, required: true },
        ],
      },
      {
        title: "Deductibles",
        icon: "🛡️",
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
        icon: "⚖️",
        questions: [
          { id: "liab_class", label: "Liability Class", type: "select", options: ["Public Liability", "Employers Liability", "Professional Indemnity", "Product Liability", "Directors & Officers"], required: true },
          { id: "business_type", label: "Business / Trade", type: "select", options: ["Retail / Shop", "Office / Professional", "Manufacturing", "Construction", "Healthcare", "Financial Services"], required: true },
          { id: "employees", label: "Number of Employees", type: "select", options: ["1–10", "11–50", "51–200", "201–500", "500+"], required: true },
        ],
      },
      {
        title: "Limits & Rates",
        icon: "📋",
        questions: [
          { id: "indemnity_limit", label: "Limit of Indemnity (ETB)", type: "number", unit: "ETB", required: true },
          { id: "base_rate", label: "Base Premium Rate (%‰ of Limit)", type: "rate", unit: "‰", min: 0.1, max: 10, step: 0.01, required: true },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 500, required: true },
          { id: "retro_date_discount", label: "Retroactive Date Discount (%)", type: "rate", unit: "%", min: 0, max: 15, step: 0.5 },
        ],
      },
      {
        title: "Loadings",
        icon: "📈",
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
        icon: "🔒",
        questions: [
          { id: "premises_type", label: "Premises Type", type: "select", options: ["Residential", "Retail Shop", "Office", "Bank / Jeweller", "Warehouse"], required: true },
          { id: "security_grade", label: "Security Grading", type: "select", options: ["Grade A – CCTV + Guards + Alarm", "Grade B – Alarm + Guards", "Grade C – Alarm Only", "Grade D – Locks Only", "No Security"], required: true },
          { id: "location_risk", label: "Location Risk", type: "select", options: ["Low Risk Zone", "Medium Risk Zone", "High Risk Zone", "Very High Risk Zone"], required: true },
        ],
      },
      {
        title: "Premium Rates",
        icon: "💰",
        questions: [
          { id: "base_rate", label: "Base Rate (%‰ of Sum Insured)", type: "rate", unit: "‰", min: 0.1, max: 10, step: 0.01, required: true },
          { id: "cash_in_safe_rate", label: "Cash in Safe Rate (%‰)", type: "rate", unit: "‰", min: 0.5, max: 15, step: 0.01 },
          { id: "cash_in_transit_rate", label: "Cash in Transit Rate (%‰)", type: "rate", unit: "‰", min: 0.5, max: 20, step: 0.01 },
          { id: "min_premium", label: "Minimum Premium (ETB)", type: "number", unit: "ETB", min: 200, required: true },
        ],
      },
      {
        title: "Discounts & Loading",
        icon: "⚖️",
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
const errors   = ref({});

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
  await new Promise(r => setTimeout(r, 1200));
  saving.value = false;
  saved.value  = true;
  setTimeout(() => (saved.value = false), 3000);
}

function reset() {
  form.value   = {};
  errors.value = {};
}

const activeSection = ref(0);
</script>

<template>
  <div class="rf-root" v-if="typeDef">

    <!-- ── Top bar ── -->
    <div class="rf-topbar">
      <button class="rf-back" @click="router.push('/rate-config')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
        Rate Configuration
      </button>

      <div class="rf-breadcrumb">
        <span class="rf-bc-sep">/</span>
        <span class="rf-bc-current">{{ typeDef.name }}</span>
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
            Save Rates
          </template>
        </button>
      </div>
    </div>

    <!-- ── Hero ── -->
    <div class="rf-hero" :style="`background: linear-gradient(135deg, ${typeDef.color.from}, ${typeDef.color.to})`">
      <div class="rf-hero-shine"></div>
      <div class="rf-hero-dots"></div>
      <div class="rf-hero-content">
        <div class="rf-hero-icon" v-html="typeDef.icon"></div>
        <div>
          <h1 class="rf-hero-title">{{ typeDef.name }}</h1>
          <p class="rf-hero-desc">{{ typeDef.description }}</p>
        </div>
      </div>
      <div class="rf-hero-meta">
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
        <p class="rf-sidebar-label">Sections</p>
        <button
          v-for="(sec, i) in typeDef.sections"
          :key="i"
          class="rf-sec-btn"
          :class="{ 'rf-sec-active': activeSection === i }"
          :style="activeSection === i ? `border-left-color: ${typeDef.color.accent}; color: ${typeDef.color.accent}` : ''"
          @click="activeSection = i"
        >
          <span class="rf-sec-emoji">{{ sec.icon }}</span>
          <span>{{ sec.title }}</span>
        </button>

        <!-- completion indicator -->
        <div class="rf-progress-wrap">
          <div class="rf-progress-label">
            <span>Completion</span>
            <span>{{ Math.round((Object.keys(form).filter(k => form[k] !== '' && form[k] !== undefined && form[k] !== null).length / typeDef.sections.reduce((a,s) => a+s.questions.filter(q=>q.required).length,0)) * 100) }}%</span>
          </div>
          <div class="rf-progress-bar">
            <div class="rf-progress-fill"
              :style="`width: ${Math.min(100,Math.round((Object.keys(form).filter(k => form[k] !== '' && form[k] !== undefined && form[k] !== null).length / Math.max(1,typeDef.sections.reduce((a,s) => a+s.questions.filter(q=>q.required).length,0))) * 100))}%; background: ${typeDef.color.accent}`">
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
            <span class="rf-section-emoji">{{ section.icon }}</span>
            <div>
              <h2 class="rf-section-title">{{ section.title }}</h2>
              <p class="rf-section-count">{{ section.questions.length }} parameters</p>
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
                      :style="`--accent:${typeDef.color.accent}; --pct:${Math.round(((form[q.id]||q.min||0)-(q.min||0))/((q.max||100)-(q.min||0))*100)}%`"
                    />
                    <div class="rf-slider-val" :style="`border-color:${typeDef.color.accent}; color:${typeDef.color.accent}`">
                      {{ (form[q.id] ?? q.min ?? 0).toFixed(2) }}<span class="rf-val-unit">{{ q.unit }}</span>
                    </div>
                  </div>
                  <p v-if="q.help" class="rf-help">{{ q.help }}</p>
                  <!-- savings badge -->
                  <div v-if="(q.label.toLowerCase().includes('discount') || q.label.toLowerCase().includes('bonus')) && (form[q.id] ?? 0) > 0" class="rf-savings-badge">
                    <span class="rf-savings-icon">🎉</span>
                    <div>
                      <span class="rf-savings-headline">Saves {{ (form[q.id] ?? 0).toFixed(1) }}% off premium</span>
                      <span class="rf-savings-example">e.g. ETB 10,000 base → customer pays ETB {{ (10000 - (form[q.id] ?? 0) * 100).toLocaleString() }}</span>
                    </div>
                  </div>
                  <div v-else-if="q.label.toLowerCase().includes('loading') && (form[q.id] ?? 0) > 0" class="rf-loading-badge">
                    <span>⚠️</span>
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

          <!-- Discount preview panel (shown if section has any discount/bonus fields with values) -->
          <div
            v-if="section.questions.some(q => (q.label.toLowerCase().includes('discount') || q.label.toLowerCase().includes('bonus')) && form[q.id] > 0)"
            class="rf-preview-panel"
            :style="`border-color:${typeDef.color.accent}33; background: linear-gradient(135deg,${typeDef.color.from}08,${typeDef.color.to}12)`"
          >
            <div class="rf-preview-header" :style="`color:${typeDef.color.to}`">
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
                  <span class="rf-preview-disc-val" :style="`color:${typeDef.color.to}`">−{{ (form[q.id]).toFixed(1) }}% → −ETB {{ ((form[q.id]/100)*10000).toLocaleString() }}</span>
                </div>
              </template>
              <div class="rf-preview-total" :style="`border-color:${typeDef.color.accent}33`">
                <span>Total Discount</span>
                <span class="rf-preview-total-val" :style="`color:${typeDef.color.to}`">
                  −{{ section.questions.filter(q2 => (q2.label.toLowerCase().includes('discount')||q2.label.toLowerCase().includes('bonus')) && form[q2.id]>0).reduce((s,q2)=>s+(form[q2.id]||0),0).toFixed(1) }}%
                  &nbsp;→&nbsp;
                  ETB {{ (10000 - section.questions.filter(q2=>(q2.label.toLowerCase().includes('discount')||q2.label.toLowerCase().includes('bonus'))&&form[q2.id]>0).reduce((s,q2)=>s+(form[q2.id]||0)/100*10000,0)).toLocaleString() }}
                </span>
              </div>
              <p class="rf-preview-note">* Illustrative only — based on a ETB 10,000 sample premium</p>
            </div>
          </div>

          <!-- Next/Prev buttons -->
          <div class="rf-section-nav">
            <button v-if="si > 0" class="rf-btn-ghost" @click="activeSection = si - 1">
              ← Previous
            </button>
            <button v-if="si < typeDef.sections.length - 1" class="rf-btn-next" :style="`background: ${typeDef.color.to}`" @click="activeSection = si + 1">
              Next Section →
            </button>
            <button v-else class="rf-btn-next" :style="`background: ${typeDef.color.to}`" @click="save" :disabled="saving">
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
    <button class="rf-btn-ghost" @click="router.push('/rate-config')">← Back</button>
  </div>
</template>

<style scoped>
.rf-root {
  min-height: 100%;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
}

/* ── Top bar ── */
.rf-topbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.rf-back {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; font-weight: 600; color: #475569;
  background: none; border: none; cursor: pointer;
  padding: 0.375rem 0.625rem; border-radius: 0.5rem;
  transition: background 0.15s, color 0.15s;
}
.rf-back:hover { background: #f1f5f9; color: #0f172a; }
.rf-breadcrumb { display: flex; align-items: center; gap: 0.375rem; }
.rf-bc-sep { color: #cbd5e1; }
.rf-bc-current { font-size: 0.8125rem; font-weight: 700; color: #0f172a; }
.rf-topbar-actions { display: flex; align-items: center; gap: 0.625rem; margin-left: auto; }

/* ── Buttons ── */
.rf-btn-ghost {
  padding: 0.4rem 1rem; border-radius: 0.5rem;
  border: 1px solid #e2e8f0; background: #fff;
  font-size: 0.8125rem; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.rf-btn-ghost:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

.rf-btn-save {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.45rem 1.25rem; border-radius: 0.5rem;
  border: none; background: #2563eb;
  font-size: 0.8125rem; font-weight: 700; color: #fff;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(37,99,235,0.3);
}
.rf-btn-save:hover { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
.rf-btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
.rf-btn-saving { background: #475569 !important; box-shadow: none !important; }
.rf-btn-saved  { background: #059669 !important; box-shadow: 0 2px 8px rgba(5,150,105,0.35) !important; }

.rf-spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Hero ── */
.rf-hero {
  position: relative;
  overflow: hidden;
  padding: 2rem 2rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  flex-shrink: 0;
}
.rf-hero-shine {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 15% 50%, rgba(255,255,255,0.15) 0%, transparent 60%);
  pointer-events: none;
}
.rf-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}
.rf-hero-content {
  position: relative;
  display: flex; align-items: center; gap: 1rem;
}
.rf-hero-icon {
  width: 3.5rem; height: 3.5rem;
  border-radius: 1rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.rf-hero-icon :deep(svg) { width: 1.75rem; height: 1.75rem; }
.rf-hero-title {
  font-size: 1.5rem; font-weight: 900; color: #fff;
  line-height: 1.2; letter-spacing: -0.02em;
}
.rf-hero-desc {
  font-size: 0.8125rem; color: rgba(255,255,255,0.65);
  margin-top: 0.25rem; max-width: 480px;
}
.rf-hero-meta {
  position: relative;
  display: flex; align-items: center; gap: 0.625rem;
}
.rf-meta-pill {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.875rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 9999px;
  font-size: 0.75rem; font-weight: 600; color: #fff;
  backdrop-filter: blur(4px);
}

/* ── Body layout ── */
.rf-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ── Sidebar ── */
.rf-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.rf-sidebar-label {
  font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.12em; color: #94a3b8; margin-bottom: 0.5rem;
  padding: 0 0.5rem;
}
.rf-sec-btn {
  display: flex; align-items: center; gap: 0.6rem;
  width: 100%; padding: 0.6rem 0.75rem;
  border-radius: 0.5rem; border: none; border-left: 3px solid transparent;
  background: transparent; text-align: left;
  font-size: 0.8rem; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.14s;
}
.rf-sec-btn:hover { background: #f8fafc; color: #0f172a; }
.rf-sec-active { background: #f0f7ff !important; font-weight: 700; }
.rf-sec-emoji { font-size: 1rem; flex-shrink: 0; }

.rf-progress-wrap { margin-top: auto; padding-top: 1rem; }
.rf-progress-label {
  display: flex; justify-content: space-between;
  font-size: 0.7rem; font-weight: 600; color: #64748b;
  margin-bottom: 0.375rem;
}
.rf-progress-bar {
  height: 4px; border-radius: 9999px; background: #e2e8f0; overflow: hidden;
}
.rf-progress-fill {
  height: 100%; border-radius: 9999px;
  transition: width 0.3s ease;
}

/* ── Form panel ── */
.rf-form-panel {
  flex: 1;
  overflow-y: auto;
  padding: 1.75rem 2rem;
  background: #f1f5f9;
}

/* each section renders inside a white card */
.rf-section {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  padding: 1.75rem;
  margin-bottom: 1.5rem;
}

.rf-section-header {
  display: flex; align-items: center; gap: 0.875rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}
.rf-section-emoji { font-size: 1.75rem; flex-shrink: 0; }
.rf-section-title {
  font-size: 1.0625rem; font-weight: 800; color: #0f172a;
  letter-spacing: -0.01em;
}
.rf-section-count {
  font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem;
}

/* ── Fields grid ── */
.rf-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 2rem;
  align-items: start;
}
@media (max-width: 860px) { .rf-fields { grid-template-columns: 1fr; } }

/* rate fields span both columns — slider needs full horizontal room */
.rf-field { display: contents; }
.rf-field.rf-field-rate { display: block; grid-column: 1 / -1; }

/* unit prefix slot inside CustomInput left slot */
.rf-prefix {
  display: flex; align-items: center;
  padding: 0 0.625rem 0 0.875rem;
  font-size: 0.75rem; font-weight: 700; color: #64748b;
  border-right: 1px solid #e2e8f0;
  height: 100%; white-space: nowrap;
  user-select: none;
}

.rf-required { color: #ef4444; }
.rf-unit-badge {
  font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
  padding: 0.15rem 0.5rem; border-radius: 9999px;
  background: #dbeafe; color: #1d4ed8; letter-spacing: 0.06em;
  flex-shrink: 0; border: 1px solid #bfdbfe;
}
.rf-help {
  font-size: 0.7rem; color: #94a3b8;
  line-height: 1.45; margin-top: 0.25rem;
}

/* ── Rate field wrapper ── */
.rf-rate-field {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.625rem;
}
.rf-rate-label {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.rf-rate-label-text {
  font-size: 0.8125rem; font-weight: 700; color: #334155;
}

/* slider row: track + value badge side by side */
.rf-slider-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.rf-slider {
  flex: 1;
  min-width: 0;          /* prevents overflow */
  -webkit-appearance: none; appearance: none;
  height: 6px; border-radius: 9999px;
  background: linear-gradient(
    to right,
    var(--accent, #2563eb) var(--pct, 0%),
    #e2e8f0 var(--pct, 0%)
  );
  outline: none; cursor: pointer;
}
.rf-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--accent, #2563eb);
  border: 2.5px solid #fff;
  box-shadow: 0 0 0 2px var(--accent, #2563eb), 0 2px 6px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.rf-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 4px var(--accent, #2563eb), 0 2px 8px rgba(0,0,0,0.2);
}
.rf-slider::-moz-range-thumb {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--accent, #2563eb);
  border: 2.5px solid #fff;
  cursor: pointer;
}

/* value badge */
.rf-slider-val {
  flex-shrink: 0;
  min-width: 5.5rem;
  text-align: center;
  padding: 0.35rem 0.75rem;
  border: 2px solid;
  border-radius: 0.5rem;
  background: #fff;
  font-size: 1rem; font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
  display: flex; align-items: baseline; justify-content: center; gap: 0.2rem;
}
.rf-val-unit {
  font-size: 0.65rem; font-weight: 700;
  opacity: 0.7; letter-spacing: 0;
}

/* inline savings badge (per field) */
.rf-savings-badge {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #86efac;
  border-radius: 0.5rem;
  animation: fadeUp 0.25s ease;
}
.rf-savings-icon { font-size: 1rem; flex-shrink: 0; line-height: 1.4; }
.rf-savings-headline {
  display: block;
  font-size: 0.78rem; font-weight: 700; color: #15803d;
}
.rf-savings-example {
  display: block;
  font-size: 0.7rem; color: #16a34a; margin-top: 0.1rem;
}

/* inline loading badge (per field) */
.rf-loading-badge {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
  font-size: 0.75rem; font-weight: 600; color: #c2410c;
  animation: fadeUp 0.25s ease;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}


/* ── Discount preview panel ── */
.rf-preview-panel {
  margin-top: 1.5rem;
  border: 1.5px solid;
  border-radius: 0.875rem;
  overflow: hidden;
  animation: fadeUp 0.3s ease;
}
.rf-preview-header {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.125rem;
  font-size: 0.8125rem; font-weight: 800;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.6);
}
.rf-preview-body {
  padding: 1rem 1.125rem;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.rf-preview-example {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed rgba(0,0,0,0.1);
}
.rf-preview-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
.rf-preview-val   { font-size: 0.875rem; font-weight: 800; color: #0f172a; }
.rf-preview-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.78rem;
}
.rf-preview-disc-label { color: #374151; font-weight: 500; }
.rf-preview-disc-val   { font-weight: 700; }
.rf-preview-total {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 0.5rem;
  border-top: 2px solid;
  font-size: 0.8125rem; font-weight: 700; color: #0f172a;
  margin-top: 0.25rem;
}
.rf-preview-total-val { font-weight: 800; font-size: 0.9rem; }
.rf-preview-note {
  font-size: 0.68rem; color: #94a3b8;
  margin-top: 0.25rem; font-style: italic;
}

/* Section nav */
.rf-section-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1.75rem; padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}
.rf-btn-next {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.55rem 1.5rem; border-radius: 0.5rem;
  border: none; color: #fff;
  font-size: 0.8125rem; font-weight: 700;
  cursor: pointer; transition: all 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.rf-btn-next:hover { filter: brightness(1.1); }
.rf-btn-next:disabled { opacity: 0.7; cursor: not-allowed; }

/* Not found */
.rf-not-found {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem;
  min-height: 60vh;
  font-size: 1rem; color: #64748b;
}

@media (max-width: 768px) {
  .rf-body { flex-direction: column; }
  .rf-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #e2e8f0; flex-direction: row; flex-wrap: wrap; padding: 0.75rem; }
  .rf-sidebar-label { display: none; }
  .rf-progress-wrap { display: none; }
  .rf-sec-btn { width: auto; border-left: none; border-bottom: 3px solid transparent; }
  .rf-form-panel { padding: 1rem; }
  .rf-section { padding: 1.25rem; border-radius: 0.75rem; }
  .rf-fields { gap: 1rem 1.25rem; }
}
</style>
