# GreenBasket Morning Magic

GREENBASKET — IMMERSIVE 3D SCROLLING SUBSCRIPTION STORE

Build a premium, immersive, highly interactive 3D e-commerce subscription website for:

GreenBasket Fresh Farm & Organic Store

This must be a completely standalone frontend project.

Do NOT connect to Razorpay, RecoverIQ, Supabase, authentication, or any existing project yet.

The purpose of this version is to build and perfect the 3D shopping experience and dynamic subscription basket first.

CORE CONCEPT

GreenBasket delivers fresh products every morning.

Customers can choose:

WHAT they want

HOW MUCH they want

HOW OFTEN they want

from the available GreenBasket products.

The customer can browse all 8 categories, select products, increase/decrease quantity, and build their own personalized daily morning basket.

At the end, the website calculates:

Daily Basket Price

and

Estimated Monthly Subscription Price

dynamically.

The entire experience must be presented as a cinematic 3D scrolling website.

THE MOST IMPORTANT UX REQUIREMENT

This is NOT a normal scrolling website.

It must behave like an immersive interactive 3D product experience.

There are:

8 CATEGORY WORLDS

🥛 Dairy

🍞 Bakery

🥬 Vegetables

🍎 Fruits

🥜 Breakfast

🧃 Drinks

🌾 Staples

🌿 Herbs

Each category is its own 3D environment/world.

When the user enters a category:

The entire background changes according to that category

The 3D environment animates

The category title appears

A centered glassmorphism shopping panel appears

Products for ONLY that category are shown

Products have images/3D visual treatment

User can add products to the bag

User can increase/decrease quantity

Daily price updates

Monthly price updates

Category-specific animations occur

CRITICAL SCROLL BEHAVIOR

Implement TWO different scroll zones.

1. INSIDE THE GLASSMORPHISM PRODUCT PANEL

When the cursor/finger is inside the centered glassmorphism panel:

Scroll should ONLY scroll the products inside that panel.

It must NOT immediately move to the next category.

Example:

CATEGORY: DAIRY

┌──────────────────────────────────┐
│                                  │
│       🥛 DAIRY                   │
│                                  │
│   Organic Milk       ₹60         │
│   [-] 1 [+]                     │
│                                  │
│   A2 Milk            ₹90         │
│   [-] 0 [+]                     │
│                                  │
│   Greek Yogurt       ₹120        │
│   [-] 1 [+]                     │
│                                  │
│        ↓ MORE PRODUCTS           │
│                                  │
└──────────────────────────────────┘


Scrolling inside this panel:

→ Only the product list moves.

The outer category must remain fixed.

2. OUTSIDE THE GLASSMORPHISM PANEL

When the user scrolls outside the product panel:

The entire category/world should transition.

Example:

Dairy
   ↓
Bakery
   ↓
Vegetables
   ↓
Fruits
   ↓
Breakfast
   ↓
Drinks
   ↓
Staples
   ↓
Herbs


The transition must be cinematic and 3D.

IMPORTANT SCROLL INTERACTION

Do not make the user accidentally skip categories.

Use controlled snapping / scroll sections.

Each category should occupy a full-screen viewport.

When the user scrolls outside the inner product panel:

Snap to next category

Animate 3D background

Animate camera

Change lighting

Change colors

Change environment

Change product collection

Change category title

Scrolling upward should reverse the experience.

HOMEPAGE / INTRODUCTION

Before Dairy, create a cinematic 3D introduction.

Full-screen 3D farm scene.

Show:

Sunrise

Green organic farm

Trees

Vegetable fields

Farmhouse

Wooden crates

Milk bottles

Bread basket

Fruits

Delivery basket

Soft morning fog

Camera slowly moves through the farm.

Center text:

GREENBASKET

Freshness. Every Morning.

Subtitle:

Build your own morning basket.

Secondary text:

Choose what you want. Choose how much. We deliver it fresh to your doorstep.

CTA:

START BUILDING YOUR BASKET ↓

As the user scrolls, transition into:

🥛 DAIRY

CATEGORY 01 — 🥛 DAIRY

Create a dedicated 3D dairy environment.

Background should contain:

Green pasture

Cows in the distance

Milk bottles

Wooden crates

Morning sunlight

Barn

Soft fog

Floating subtle particles

Use a premium natural green/cream color palette.

Camera should slowly move/animate based on scroll.

Center screen:

A large glassmorphism panel.

Top of panel:

🥛 DAIRY

Subtitle:

Fresh from the farm, every morning.

Inside the panel show the 10 dairy products.

Products:

Organic Cow Milk — 500ml

Organic Cow Milk — 1L

A2 Cow Milk — 1L

Buffalo Milk — 1L

Organic Curd — 500g

Greek Yogurt — 400g

Buttermilk — 500ml

Paneer — 200g

Fresh Cheese — 200g

Fresh Butter — 200g

Use realistic placeholder images or high-quality generated/remote image assets.

Each product card must show:

Product image

Product name

Unit

Price per unit/day

Quantity controls

Add button

Example:

┌─────────────────────────────┐
│        [PRODUCT IMAGE]      │
│                             │
│ Organic Cow Milk            │
│ 1L                          │
│                             │
│ ₹70 / day                   │
│                             │
│       −   1   +             │
│                             │
│       ADD TO BAG            │
└─────────────────────────────┘


CATEGORY 02 — 🍞 BAKERY

Transition from the farm into a warm 3D artisan bakery.

Background:

Bakery

Wooden tables

Oven

Fresh sourdough

Bread

Flour particles

Warm sunlight

Steam

Category:

🍞 BAKERY

Products:

Sourdough Bread — 400g

Multigrain Bread — 400g

Whole Wheat Bread — 400g

Millet Bread — 400g

Croissant — 2 pcs

Multigrain Buns — 4 pcs

Banana Bread — 400g

Homemade Granola — 400g

All products must support:

Quantity +/-

Add to Bag

Daily price

Dynamic monthly price

CATEGORY 03 — 🥬 VEGETABLES

Create a lush 3D organic vegetable farm.

Background:

Vegetable rows

Soil

Green leaves

Harvest baskets

Farmer/farm elements

Morning sunlight

Subtle wind animation

Category:

🥬 VEGETABLES

Products:

Tomato — 500g

Potato — 1kg

Onion — 1kg

Carrot — 500g

Beetroot — 500g

Spinach — 1 bunch

Coriander — 1 bunch

Mint — 1 bunch

Cucumber — 500g

Capsicum — 500g

Broccoli — 1 pc

Cauliflower — 1 pc

Green Beans — 500g

Green Peas — 500g

Bottle Gourd — 1 pc

Ridge Gourd — 500g

Lady Finger — 500g

Brinjal — 500g

Pumpkin — 1kg

Sweet Corn — 2 pcs

Lettuce — 1 head

Zucchini — 500g

CATEGORY 04 — 🍎 FRUITS

Create a beautiful 3D orchard.

Background:

Fruit trees

Apples

Bananas

Oranges

Grapes

Baskets

Sunlight

Leaves gently moving

Floating fruit particles

Category:

🍎 FRUITS

Products:

Apple — 1kg

Banana — 1 dozen

Orange — 1kg

Papaya — 1 pc

Watermelon — 1 pc

Pomegranate — 1kg

Guava — 1kg

Grapes — 500g

Mango — 1kg

Kiwi — 4 pcs

For Mango:

Show:

Seasonal

CATEGORY 05 — 🥜 BREAKFAST

Create a warm healthy breakfast environment.

Background:

Breakfast table

Oats

Granola

Nuts

Honey

Wooden bowls

Morning sunlight

Kitchen environment

Category:

🥜 BREAKFAST

Products:

Oats — 500g

Muesli — 500g

Granola — 400g

Chia Seeds — 250g

Flax Seeds — 250g

Almonds — 250g

Walnuts — 250g

Pumpkin Seeds — 250g

Peanut Butter — 340g

Organic Honey — 500g

CATEGORY 06 — 🧃 DRINKS

Create a refreshing 3D juice bar / morning drinks environment.

Background:

Fresh juice

Oranges

Apples

Carrots

Coconut

Ice

Glass bottles

Water droplets

Bright morning lighting

Category:

🧃 DRINKS

Products:

Fresh Orange Juice — 500ml

Fresh Apple Juice — 500ml

Green Juice — 500ml

Carrot Juice — 500ml

Beetroot Juice — 500ml

Coconut Water — 500ml

Fresh Lemon Juice — 500ml

CATEGORY 07 — 🌾 STAPLES

Create a premium organic grain environment.

Background:

Wheat field

Rice

Millet

Wooden grain containers

Grain particles

Warm sunlight

Category:

🌾 STAPLES

Products:

Organic Brown Rice — 1kg

Organic Red Rice — 1kg

Organic Wheat Flour — 1kg

Organic Millet Flour — 1kg

Ragi Flour — 1kg

Jowar Flour — 1kg

Bajra Flour — 1kg

CATEGORY 08 — 🌿 HERBS

Final category should feel like a fresh herb garden.

Background:

Basil

Mint

Coriander

Curry leaves

Rosemary

Parsley

Green plants

Morning dew

Soft sunlight

Category:

🌿 HERBS

Products:

Basil

Curry Leaves

Coriander

Mint

Rosemary

Parsley

PRODUCT PRICING SYSTEM

Every product must have a configurable base daily price.

Create a product data structure:

Product {
  id
  name
  category
  unit
  pricePerDay
  image
  description
}


Do NOT hardcode calculations inside UI components.

Use product data.

QUANTITY SYSTEM

Every product must support:

−  quantity  +


Rules:

Minimum:

0

Maximum:

20

Clicking:

+

increases quantity by 1.

Clicking:

−

decreases quantity by 1.

If quantity reaches 0:

Remove product from basket.

DYNAMIC PRICE CALCULATION

This is extremely important.

The website must calculate prices dynamically.

For every selected product:

Product daily price × quantity


Then:

Total Daily Basket Price


Then:

Total Daily Basket Price × 30


equals:

Estimated Monthly Subscription

Assume:

30 delivery days/month

Example:

Customer selects:

Organic Milk:

₹70/day × 1

Sourdough:

₹120/day × 1

Banana:

₹80/day × 1

Daily total:

₹270

Monthly:

₹270 × 30

₹8,100 / month

These numbers are examples only.

Use configurable prices in the product data.

FLOATING BAG UI

Always show a floating shopping bag.

Position:

Bottom-right.

Example:

┌─────────────────────────┐
│ 🛍 MY MORNING BAG       │
│                         │
│ 7 items                 │
│                         │
│ Today                   │
│ ₹270                    │
│                         │
│ Monthly                 │
│ ₹8,100                  │
│                         │
│ VIEW BAG →              │
└─────────────────────────┘


The bag should update instantly whenever quantity changes.

Use a smooth animation when an item is added.

BAG DRAWER

Clicking:

VIEW BAG

opens a beautiful glassmorphism side drawer.

Show:

Selected products

Product images

Quantity

+/- controls

Individual daily price

Individual monthly price

Total daily price

Estimated monthly price

Example:

MY MORNING BAG

Organic Cow Milk
1L
₹70/day
₹2,100/month
[-] 1 [+]

Sourdough Bread
400g
₹120/day
₹3,600/month
[-] 1 [+]

Banana
1 dozen
₹80/day
₹2,400/month
[-] 1 [+]

────────────────

Daily Basket
₹270

Monthly Subscription
₹8,100

[ CONTINUE ]


FINAL BASKET PAGE

After the user finishes selecting products:

Create a premium final summary page.

Large heading:

YOUR MORNING, YOUR WAY.

Show the complete personalized basket.

Display:

Daily Basket

₹X/day

Monthly Subscription

₹X/month

Also show:

Number of products

Total quantities

Delivery frequency

6 AM delivery

Estimated monthly total

CTA:

BUILD MY SUBSCRIPTION

This button can open a mock confirmation modal.

Do NOT process real payments.

3D DESIGN REQUIREMENTS

Every category should have its own visual identity.

The transitions should be smooth.

Example:

DAIRY
3D farm
   ↓
camera movement
   ↓
BAKERY
3D bakery
   ↓
camera movement
   ↓
VEGETABLES
3D farm
   ↓
camera movement
   ↓
FRUITS
3D orchard
   ↓
...


Avoid hard cuts.

Use:

Camera interpolation

Fade transitions

Scale

Parallax

Depth

Blur

Lighting transitions

Object movement

GLASSMORPHISM PANEL

The category shopping panel must remain centered.

Use:

Transparent white/cream glass

backdrop-filter: blur(...)

Subtle border

Soft shadow

Slight transparency

Rounded corners

Depth

Premium typography

Do NOT make it completely opaque.

The background 3D world must remain visible through the panel.

INNER PANEL SCROLL

The inner product area must have its own scroll container.

Important:

Outer page scroll
=
Change category

Inner product panel scroll
=
Change products


Use event handling carefully to prevent scroll propagation.

The inner panel should have:

Smooth scrolling

Custom scrollbar

Scroll indicators

Product reveal animations

At the bottom of the product list, allow the next outer scroll to continue naturally.

3D PRODUCT INTERACTIONS

When hovering over a product:

Image slightly scales

Product card lifts

Image rotates slightly

Shadow changes

Glass reflection changes

Add button appears/emphasizes

When adding:

Small particle burst

Bag icon reacts

Product quantity updates

Price updates

Keep animations premium and subtle.

CATEGORY INDICATOR

Add a minimal vertical indicator on the side:

● Dairy
○ Bakery
○ Vegetables
○ Fruits
○ Breakfast
○ Drinks
○ Staples
○ Herbs


Current category should be highlighted.

Clicking a category should smoothly navigate to that category.

PROGRESS INDICATOR

Show:

01 / 08
DAIRY


Then:

02 / 08
BAKERY


etc.

Keep it minimal.

BACKGROUND ANIMATION

The background should NEVER feel static.

Each category should have subtle movement:

Dairy:

Clouds

Grass

Milk bottle rotation

Light movement

Bakery:

Steam

Flour particles

Oven glow

Vegetables:

Wind

Leaves

Camera movement

Fruits:

Leaves

Floating particles

Gentle fruit movement

Breakfast:

Steam

Light

Floating particles

Drinks:

Water droplets

Juice movement

Light reflections

Staples:

Grain movement

Wheat motion

Herbs:

Leaves

Dew

Wind

TYPOGRAPHY

Use a premium modern font combination.

Large editorial headings.

Example:

FRESHNESS.

EVERY MORNING.

Do not fill the screen with text.

Typography should feel premium and cinematic.

COLOR SYSTEM

Primary:

Natural greens

Secondary:

Cream

Accent:

Warm yellow/golden morning sunlight

Additional:

Earth tones

Avoid:

Neon green

Excessive purple

Excessive blue

Cheap gradients

RESPONSIVE DESIGN

Desktop is the primary target.

On tablet/mobile:

Maintain category-by-category experience

Reduce 3D complexity

Reduce particle count

Simplify camera movement

Keep glassmorphism panel usable

Make product list touch-friendly

On mobile:

Inner product panel must still scroll independently.

PERFORMANCE

Optimize aggressively.

Use:

Lazy loading

Suspense

Optimized assets

Low-poly models

Instancing

DPR limits

Efficient animations

Reduced particle count on mobile

Do NOT allow the 3D background to make the website lag.

ACCESSIBILITY

Support:

Keyboard navigation

Focus states

Accessible buttons

Readable text

Reduced motion preference

For users with reduced motion:

Replace heavy camera movement with subtle transitions.

DATA ARCHITECTURE

Keep all 80 products inside a centralized product dataset.

Create:

products.ts


with:

id

name

category

unit

pricePerDay

image

description

Create category metadata:

categories.ts


with:

id

name

icon

title

subtitle

background

theme

The UI should dynamically render categories from this data.

Do NOT create eight completely separate hardcoded shopping implementations.

FINAL EXPERIENCE

The complete user journey should be:

OPEN WEBSITE
      ↓
3D GREENBASKET INTRO
      ↓
SCROLL
      ↓
🥛 DAIRY
      ↓
Browse products inside glass panel
      ↓
Add milk
      ↓
Increase quantity
      ↓
Daily + Monthly price updates
      ↓
Scroll outside panel
      ↓
🍞 BAKERY
      ↓
Browse + add products
      ↓
Scroll outside panel
      ↓
🥬 VEGETABLES
      ↓
...
      ↓
🌿 HERBS
      ↓
FINAL BASKET
      ↓
Personalized Daily Basket
      ↓
Monthly Subscription Price
      ↓
BUILD MY SUBSCRIPTION


MOST IMPORTANT DESIGN PRINCIPLE

The website must communicate:

"I build my own morning basket."

The customer should feel like they are travelling through a beautiful 3D GreenBasket world while progressively building their personalized subscription.

This is NOT just an online grocery catalog.

It is:

AN IMMERSIVE 3D MORNING BASKET BUILDER

FINAL QUALITY CHECK

Before finishing, test:

All 80 products exist

Exactly 8 categories exist

Correct category ordering

Product images load

+/- works

Quantity updates correctly

Daily price updates

Monthly price updates

Bag updates instantly

Bag drawer works

Final basket works

Inner panel scrolling works

Outer category scrolling works

Scroll does not accidentally skip categories

Reverse scrolling works

Category navigation works

3D backgrounds transition correctly

Glassmorphism remains readable

Mobile works

No console errors

No broken buttons

No fake payment functionality

No external backend dependency

FINAL INSTRUCTION

Do not create a generic ecommerce template.

Do not create a normal landing page.

Do not create eight separate pages.

Create ONE immersive, continuous, cinematic 3D GreenBasket experience where:

SCROLL = STORY

INNER SCROLL = PRODUCTS

OUTER SCROLL = CATEGORY

+ / − = QUANTITY

QUANTITY = PRICE

SELECTED PRODUCTS = PERSONALIZED BASKET

PERSONALIZED BASKET = MONTHLY SUBSCRIPTION

The final website should look like a premium creative-tech website with a beautiful organic farm aesthetic and a highly polished interactive shopping experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/70a1d92d-c702-4ae5-a145-349966820bd6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
