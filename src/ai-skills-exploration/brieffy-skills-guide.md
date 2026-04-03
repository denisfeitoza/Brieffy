# Brieffy AI Skills Architecture Guide

> Reference document for AI Skills used in the Brieffy platform.
> Inspired by the SkillsMP marketplace pattern (`campaign-brief` skill) but adapted
> for conversational intelligence rather than rigid document templates.

---

## Philosophy: Conversation Over Structure

Unlike marketplace skills that produce static documents (tables, checklists),
Brieffy skills are **conversational extraction engines**. They teach the AI
HOW to think about a domain, not WHAT to output.

**Key Differences from SkillsMP skills:**
| SkillsMP Pattern | Brieffy Pattern |
|---|---|
| Rigid output templates (tables) | Conversational extraction → JSON |
| Mode: Create/Update/Find | Mode: Create/Update/Explore (with confidence thresholds) |
| User fills sections | AI infers fields from natural dialogue |
| Static document output | Dynamic briefing with real-time adaptation |

---

## Skill: Brieffy-Creative-Briefing (Core)

### Purpose
The foundational skill that powers every briefing session. Understands how
to extract comprehensive brand/business identity through conversation.

### Mode Detection
| Signal | Mode | Confidence |
|---|---|---|
| Direct answer to asked question | CREATE | 95% |
| "actually", "change", "switch to" | UPDATE | 95% |
| References previously answered topic | UPDATE | 85% |
| "what if", "how about" | EXPLORE | 90% |
| Short vague response | EXPLORE | 70% |

**Thresholds:** ≥85% auto-proceed | 70-84% state assumption | <70% ask

### Extraction Fields (Basal)
- `company_name`, `sector_segment`, `company_age`
- `services_offered`, `owner_relationship`, `brand_name_meaning`
- `keywords`, `mission_vision_values`
- `target_audience_demographics`, `competitors`
- `competitive_differentiator`, `communication_channels`
- `geographic_reach`, `brand_personality`, `tone_of_voice`

### Conversational Approach
- **Discovery (Q1-3):** Open-ended, warm, "tell me everything"
- **Confirmation (Q4-8):** Reference-based, closed, tactile inputs
- **Deep Dive (Q9+):** Full variety, package-specific depth

---

## Skill: Brieffy-Brand-DNA

### Purpose
Package-level skill for deep brand identity exploration.
Activates when `primal_branding`, `visual_identity`, or `rebranding` packages are selected.

### Unique Extraction Fields
- `brand_archetype`, `brand_values_top3`, `visual_mood`
- `typography_preference`, `color_palette_vibe`
- `brand_voice_dimensions` (multi_slider: formality, boldness, communication)

### Conversational Strategy
- Use power questions: "If your brand disappeared tomorrow, what void would it leave?"
- Approach visual identity through emotions first, then specifics
- Use card_selector for archetype/personality detection
- NEVER ask "what colors do you like" — instead explore mood and feeling

---

## Skill: Brieffy-Market-Analysis

### Purpose
Package-level skill for competitive positioning and market understanding.
Activates when `marketing`, `business_model_canvas`, or `campaign_launch` packages are selected.

### Unique Extraction Fields
- `market_position`, `pricing_strategy`, `sales_cycle`
- `competitor_strengths`, `competitor_weaknesses`
- `unique_value_proposition`, `market_trends`

### Conversational Strategy
- Approach competitors through admiration, not confrontation
- "Which company do you secretly admire — what do you envy about them?"
- Use oblique angles for pricing: "If a client compared your price to X, what would you say?"
- Extract market size through implications, not direct questions

---

## Skill: Brieffy-Campaign-Launch

### Purpose
Adapted from the SkillsMP `campaign-brief` skill for campaign-specific briefings.
Key difference: conversational extraction instead of template filling.

### Unique Extraction Fields
- `campaign_objective`, `campaign_type`, `campaign_duration`
- `target_channels`, `budget_range`, `success_metrics`
- `creative_requirements`, `key_messages`

### Conversational Strategy
- Start with the WHY: "What problem does this campaign solve?"
- Move to WHO: audience from business context, not demographics forms
- Then HOW: channels emerge from where the audience lives
- Finally WHAT: creative needs follow naturally from all above
- Budget discussion LAST — preceded by value context

---

## Cross-Skill Deduplication Rules

When multiple skills are active simultaneously:

1. **Single Question Principle:** If two skills would ask about the same topic (e.g., both marketing and campaign ask about channels), ask ONCE in the most relevant context.
2. **Cross-Inference:** When a field from Skill A logically implies a field in Skill B, add a cross-inference (confidence 0.6, source "cross_package_deduction") instead of asking.
3. **Invisible Boundaries:** The client should NEVER notice where one skill ends and another begins. Use natural pivot phrases.
4. **Compression Under Fatigue:** When engagement drops, merge questions across skills into combined inputs (e.g., multi_slider covering dimensions from multiple skills).
