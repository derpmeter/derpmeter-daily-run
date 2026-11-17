# Solving Character Consistency in AI-Generated Webtoons

## Problem Definition

When using AI image generation models to automatically create webtoon panels, **characters' costumes inconsistently change between panels**.

For example:

- Panel 1: Character wearing a white blouse
- Panel 2: Same character suddenly wearing a blue hoodie
- Panel 3: Changed again to a striped shirt

This disrupts reader immersion and significantly degrades the professionalism and quality of the webtoon.

## Root Cause Analysis

### 1. Inherent Nature of AI Image Generation

Generative AI models create images **fresh each time** based on prompts. Since they don't "remember" what was generated in previous panels, they may interpret the same character differently each time.

### 2. Limitations of Text Prompts

Even when explicitly stating "Minji wearing a white blouse," the model may:

- Interpret "white blouse" in various forms
- Deprioritize outfit information when mixed with scene descriptions, dialogue, and style instructions

### 3. Complexity of Multiple Reference Images

When individual reference images are provided for each character:

- The model may confuse which character corresponds to which reference
- As the number of references increases, each reference's influence diminishes

## Hypothesis

> Using a **Single Unified Reference Board** will enable the AI model to distinguish characters more clearly and represent them consistently.

### Rationale

1. **Unified Visual Context**: Placing all characters in a single image helps the model better understand the overall character relationships and distinctions

2. **Explicit Labeling**: Red borders and name labels visually distinguish each character, helping the model clearly recognize "who is who"

3. **Consistent Reference Point**: Using the same reference board for all panel generation maintains a constant baseline for character representation

## Solution: Episode Character Reference Board

### Overview

Before episode generation begins, **composite the costume reference images of characters appearing in that episode into a single board** and cache it. This board is then used as the reference image for all subsequent panel generation.

### Implementation Details

#### 1. Reference Board Composition

```
┌─────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────┐           │
│  │              │    │              │           │
│  │  Character 1 │    │  Character 2 │           │
│  │  Outfit Img  │    │  Outfit Img  │           │
│  │              │    │              │           │
│  └──────────────┘    └──────────────┘           │
│      Minji             Hayoung                   │
│                                                 │
│  ┌──────────────┐    ┌──────────────┐           │
│  │              │    │              │           │
│  │  Character 3 │    │  Character 4 │           │
│  │  Outfit Img  │    │  Outfit Img  │           │
│  │              │    │              │           │
│  └──────────────┘    └──────────────┘           │
│      Jihoon            Seoyeon                   │
└─────────────────────────────────────────────────┘
```

#### 2. Technical Specifications

| Item                         | Specification              | Rationale                                            |
| ---------------------------- | -------------------------- | ---------------------------------------------------- |
| **Generation Method**        | PIL (Python Image Library) | Deterministic and cost-free                          |
| **Max Characters per Board** | 4                          | Maintain image quality + optimize model recognition  |
| **Multi-Board Support**      | Auto-generate for 4+ chars | 5-8 chars → 2 boards, 9-12 chars → 3 boards          |
| **Board Resolution**         | 2048x2048 or higher        | Prevent detail loss when scaled                      |
| **Border Color**             | Red (#FF0000)              | Clear visual distinction                             |
| **Labels**                   | Character names only       | Minimize text bleeding; detailed settings via prompt |

#### 3. Prompt Structure

```
[Reference Image] is the CHARACTER REFERENCE BOARD:
- Top-left (Minji): Female protagonist, 25 years old, long black hair,
  wearing white blouse and navy skirt
- Top-right (Hayoung): Female friend, short brown hair,
  wearing casual t-shirt and jeans
...

CRITICAL: Each character MUST wear their EXACT outfit as shown in the reference board.
```

#### 4. Workflow

```
[Episode Generation Start]
        ↓
[Finalize Appearing Characters]
        ↓
[Collect/Generate Outfit Images per Character]
        ↓
[Composite Reference Board with PIL]
        ↓
[Upload to GCS & Cache URL]
        ↓
[Use Board as Reference Image for All Panel Generation]
```

### Expected Benefits

1. **Improved Costume Consistency**: Using identical visual reference minimizes costume variation
2. **Reduced Character Confusion**: Clear labeling helps AI accurately distinguish characters
3. **Enhanced Generation Efficiency**: Caching the reference board reduces repetitive generation costs
4. **Extensibility**: Applicable to other consistency issues like expressions and poses in the future

## Limitations and Future Work

1. **Costume Change Scenes**: New boards must be generated when costumes change within the narrative
2. **Potential Text Bleeding**: Name labels on the board may appear in generated images (requires monitoring)

## Conclusion

Character consistency in AI image generation is a fundamental problem that's difficult to solve with prompt engineering alone. The reference board approach, combining **visual reference unification** with **explicit labeling**, offers a practical and cost-effective solution to this challenge.

---

_This document is a technical review from the Toonify project._
