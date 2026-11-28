/**
 * The first posts. scripts/seed.ts writes them to dvine.posts (existing slugs are left alone), and the store
 * falls back to them when there is no database (a frontend-only preview deploy).
 *
 * Wording rule, same as the product pages: say what the product does and what the research does and does not
 * show. No treatment or cure claims. Prices are not quoted here (they are set in Admin › Products).
 * The team can edit or replace any of these in Admin › Blog.
 */
import type { Post } from './blog';

type Seed = Omit<Post, 'id' | 'updatedAt' | 'status' | 'author' | 'seoDescription' | 'publishedAt' | 'coverAlt' | 'featured' | 'featureOrder' | 'source' | 'externalUrl' | 'product' | 'coverImage' | 'body'>
  & { published: string; body?: string; product?: Post['product']; coverImage?: string; coverAlt?: string; featured?: boolean; source?: string; externalUrl?: string };

const OURS: Seed[] = [
  {
    slug: 'what-you-pay-for-with-crystal', category: 'value', product: 'crystal', featured: true, published: '2026-11-10',
    title: 'What you are paying for when you buy Crystal',
    excerpt: 'Crystal costs more than a filter because it is more than a filter. Here is where the money goes, part by part, and what stays with you after the sale.',
    coverImage: '/images/crystal/kitchen-pour.webp', coverAlt: 'Crystal on a kitchen counter, pouring a glass of water',
    body: `Crystal sits in a different price bracket from a kitchen water filter, and it is fair to ask why. The short answer is that a filter only takes things out of water. Crystal filters the water first and then changes it by electrolysis, and the parts that do that work are expensive to make well.

This page goes through the machine part by part, so you can judge the price for yourself.

## The plates are the engine

Inside Crystal are five plates made of titanium and coated with platinum. Water passes between them while a controlled current runs through, and that is where ionisation happens.

Both metals are chosen for a reason. Titanium does not corrode in water. Platinum lets the reaction run cleanly, without the plate itself dissolving into what you drink. Platinum is also one of the costliest metals there is, so the plates are the largest single cost in the machine. Cheaper coatings exist. They wear sooner, and worn plates mean weaker performance and metal where you do not want it.

## Filtration comes first

Ionisation does not remove anything, so the water has to be cleaned before it reaches the plates. Crystal uses PureCore multi-stage filtration: a sediment stage, a nano stage and a post-carbon stage. Each one is a cartridge that is replaced on a schedule, and the touchscreen tells you when.

## What the price covers

| Part of the price | What you get |
| --- | --- |
| HydroCore plates | Five platinum-coated titanium plates that carry out electrolysis |
| PureCore filtration | Sediment, nano and post-carbon stages, fitted before the first use |
| SmartFlow touchscreen | Live pH, ORP and filter status at the machine |
| Four water modes | Hot, Ambient, Alkaline and High-Alkaline from one tap |
| Installation | Fitted in your kitchen by a DVINE-trained technician |
| Warranty | One year on the machine, five years on the electrolysis chamber |
| Service | Certified DVINE engineers, throughout Odisha |

## You can see it working

Many water products ask you to take their word for it. Crystal shows pH and ORP on its display while the water runs, so you can read the change for your own supply. The numbers depend on the water coming in, which is why two homes will not see identical readings.

If you would like to know your starting point, [book a water test](/water-testing#book) before you decide. No purchase is needed.

## The cost over five years

A fairer way to look at the price is per day over the warranty period, set against what your household already spends on bottled or delivered water. Your figures will differ from the next family's, so we would rather you do that sum with your own numbers than trust ours.

## What Crystal is not

Crystal is a water system, not a medical device. We do not claim it treats, cures or prevents any illness. Use the drinking-water settings given in the manual, and if you have a health condition, ask your doctor about what and how much you should drink.

## See it before you buy

A demonstration costs nothing. [Book a demo](/book-demo?product=crystal) and we will show you the modes, the display and the filters, and answer questions about your kitchen and your water.`,
  },
  {
    slug: 'what-goes-into-a-hyper-bottle', category: 'value', product: 'hyper', published: '2026-11-11',
    title: 'What goes into a Hyper bottle, and why it costs more than a flask',
    excerpt: 'Hyper is a small electrolysis machine you can carry. The membrane, the platinum electrodes and the glass chamber are what set its price.',
    coverImage: '/images/hyper-exploded.webp', coverAlt: 'Hyper taken apart to show its chamber, base and electrodes',
    body: `A steel flask keeps water cold. Hyper makes something: it generates molecular hydrogen in your drinking water, on demand, wherever you are. To do that safely it carries a small electrolysis cell in its base, and that cell is most of what you pay for.

## The cell in the base

Hyper uses PEM electrolysis. PEM stands for proton exchange membrane (you may also see it written SPE). Three parts do the work:

- **Platinum-titanium electrodes.** An anode and a cathode, coated in platinum so they do not wear into the water.
- **The membrane.** A thin sheet with a titanium core that sits between the electrodes and keeps the two sides of the reaction apart.
- **The control board.** A one-touch panel with a smart timer and auto shut-off, so a cycle runs for the right time and stops by itself.

The membrane is the important difference between a PEM bottle and a cheap "hydrogen" bottle. Without it, the by-products of electrolysis stay in the water you drink. With it, hydrogen goes into the water and the rest is kept on the other side.

## What you hold in your hand

| Part | Material | Why it matters |
| --- | --- | --- |
| Chamber | Borosilicate glass | Does not hold taste or smell, and handles temperature changes |
| Cup | Anodised aluminium | Light and hard-wearing |
| Housing | BPA-free Tritan | Leak-proof, made for daily and travel use |
| Electrodes | Platinum titanium | Stable in water for the life of the bottle |
| Battery | 2000 mAh, USB-C | Rechargeable anywhere, no special charger |

## Three modes, one button

Hyper has an H2 Generation mode, an Auto Clean mode and Standby. Auto Clean matters for value: electrodes that are kept clean keep working properly, which is how the bottle lasts.

## Is it worth it?

That depends on whether hydrogen water is something you want in your day. We have written an honest summary of [what early research says about hydrogen water](/blog/hydrogen-water-what-early-research-says), including what it does not say. Read that first.

If you decide it is for you, the price buys a properly built cell, real materials, a warranty and a support team you can reach.

## What Hyper is not

Hyper does not purify water. Fill it with suitable drinking water, as the guide describes. It is also not a medicine, and we make no claim that it treats or prevents any condition.`,
  },
  {
    slug: 'how-a-titan-quotation-is-worked-out', category: 'value', product: 'titan', published: '2026-11-12',
    title: 'How a Titan quotation is worked out',
    excerpt: 'TitanForce 111 has no listed price because no two sites are the same. These are the things we ask about, and how each one affects your quotation.',
    coverImage: '/images/titan/blog-cover.webp', coverAlt: 'TitanForce 111 installed at a client site',
    body: `TitanForce 111 is priced on quotation. That can look like a way of hiding the number, so here is exactly how the number is reached.

## Why there is no listed price

Crystal goes into a kitchen, and kitchens are much alike. Titan goes into offices, hotels, restaurants and large homes, and those are not alike at all. The machine is the same; the plumbing, the number of people and the service arrangement around it are different every time. A single listed price would be wrong for almost everyone.

## What the machine is

Titan has eleven platinum-coated titanium plates, against five in Crystal. It is a floor-standing, semi-commercial system built to deliver 120 litres an hour continuously, with a SmartFlow multi-mode display. More plates and continuous output are what a shared space needs, and they are the main reason Titan costs more than a home system.

## What we ask, and why

| We ask about | Because it decides |
| --- | --- |
| Daily users | Whether one system is enough |
| Peak demand | How much water is drawn in your busiest hour |
| Source water | The filtration needed before ionisation |
| Installation area | Space, drainage, power and pipe runs |
| Number of locations | Delivery, installation visits and any volume terms |
| Service expectations | The maintenance arrangement in your quotation |

## What a quotation contains

Your quotation sets out the system, any pre-filtration for your water, installation, the warranty and the service arrangement, with GST shown separately. Nothing is added later that was not written there.

## How to get one

[Send us your site details](/for-business#enquiry). The basics are enough to begin: where you are, how many people will use it and where it will stand. If your water has not been tested recently, we may suggest [a water test](/water-testing#book) first, so the quotation is based on your actual supply.`,
  },
  {
    slug: 'hydrogen-water-what-early-research-says', category: 'benefits', product: 'hyper', published: '2026-11-13',
    title: 'Hydrogen water: what early research says, and what it does not',
    excerpt: 'Molecular hydrogen is one of the more studied ideas in wellness, but the studies are still small. A plain summary of where things stand.',
    coverImage: '/images/blog/rising-bubbles-light.webp', coverAlt: 'Bubbles rising through sunlit water',
    body: `Hydrogen water is ordinary drinking water with hydrogen gas (H2) dissolved in it. It tastes like water. The interest is in the gas, which researchers have been studying for its possible effect on oxidative stress.

We sell a hydrogen bottle, so you should read anything we say on this subject with care. We have tried to write this the way we would want it written if we were buying.

## What hydrogen water is

Water can hold only a little hydrogen: at normal pressure, about 1.6 milligrams per litre when fully saturated. The gas also leaves quickly once the bottle is open, much as fizz leaves a soft drink. That is why a bottle such as Hyper makes it fresh, a cycle at a time, and why you drink it soon after.

## What researchers are looking at

Most of the work falls into a few areas:

- **Exercise and recovery.** Small trials have looked at tiredness and muscle fatigue after hard exercise.
- **Oxidative stress.** Studies have measured blood markers of oxidative stress before and after weeks of drinking hydrogen water.
- **Metabolic health.** A few trials have followed cholesterol and blood-sugar markers in particular groups of people.

Some of these studies reported improvements. Others found little or no difference.

## How strong is the evidence?

Honestly, it is early. Most trials had a few dozen participants and ran for some weeks, not years. Methods and doses differ from one study to the next, which makes them hard to compare. Scientific reviews of the field tend to end the same way: promising, and in need of larger, longer trials.

> No health authority has approved hydrogen water to treat, cure or prevent any disease. Anyone who tells you otherwise is ahead of the evidence.

## What we can say with confidence

- It is water. Drinking enough water matters, and a bottle you like using helps you do that.
- Hydrogen gas dissolved in water is considered safe to drink at these levels.
- Hyper generates it by PEM electrolysis, which keeps the by-products of the reaction out of your water. [How the bottle is built](/blog/what-goes-into-a-hyper-bottle) explains this.

## What we will not say

We will not tell you Hyper slows ageing, cures an illness or replaces any treatment. If you have a medical condition, or you have been told to limit fluids, speak to your doctor before changing what you drink.

## If you want to try it

Treat it as a habit, not a remedy. [See Hyper](/hydrogen-bottles), read how a cycle works, and decide whether it fits your day.`,
  },
  {
    slug: 'what-ionisation-changes-in-your-water', category: 'benefits', product: 'crystal', published: '2026-11-14',
    title: 'What ionisation actually changes in your water',
    excerpt: 'pH, ORP and filtration, explained without jargon: what a home ioniser does to water, what you can measure, and where the health evidence stands.',
    coverImage: '/images/blog/ripple-rings.webp', coverAlt: 'Rings spreading across teal water',
    body: `An ioniser such as Crystal does two separate jobs. It filters your water, then it passes that water over charged plates. Each job changes something you can measure.

## Step one: filtration

Before anything else, PureCore filtration takes the water through sediment, nano and post-carbon stages. This is the part that deals with particles, chlorine taste and smell. It is ordinary, well-understood water treatment, and it is the reason filtered water tastes cleaner.

## Step two: electrolysis

The filtered water then runs between platinum-coated titanium plates carrying a small current. Two things happen at the plates:

- On one side, the water becomes more **alkaline**, and a little hydrogen is produced.
- On the other side, it becomes more **acidic**. This stream is kept separate.

Minerals already in your water, such as calcium and magnesium, are drawn towards the alkaline side. Nothing is added to the water. The machine rearranges what is already there.

## The two numbers on the display

**pH** tells you how acidic or alkaline water is. Seven is neutral. Most tap water sits close to that. Crystal's Alkaline and High-Alkaline modes raise it; Ambient leaves it as filtered water.

**ORP** (oxidation-reduction potential) is measured in millivolts. Tap water usually reads positive. Ionised alkaline water reads lower, often negative, mainly because of the dissolved hydrogen.

Crystal shows both while the water runs. Your readings depend on your source water: its minerals, its flow and its starting pH. That is why we suggest [a water test](/water-testing#book) if you want to know your starting point.

## Which mode is for what

| Mode | What comes out |
| --- | --- |
| Hot | Heated filtered water |
| Ambient | Filtered water at about neutral pH |
| Alkaline | Ionised water for everyday drinking, as set out in the manual |
| High-Alkaline | A stronger setting for the designated uses in the manual |

Use only the drinking-water settings the manual specifies.

## What about health?

This is where care is needed. Your body keeps the pH of your blood within a very narrow range whatever you drink, and your stomach is strongly acidic by design. So claims that alkaline water "balances the body's pH" are not supported.

There is some research on narrower questions. One laboratory study found that water at pH 8.8 switched off pepsin, the stomach enzyme involved in acid reflux, in a test tube. That is interesting, but a test tube is not a person, and it is not proof of a treatment. Human studies so far are few and small.

## So why choose it?

For the things you can verify: well-filtered water, a choice of modes from one tap, a display that shows what the machine is doing, and water many people simply prefer the taste of. If you drink more water because you enjoy it, that is a real gain.

For the full breakdown of the machine itself, read [what you are paying for when you buy Crystal](/blog/what-you-pay-for-with-crystal).`,
  },
];

const at = (d: string) => new Date(`${d}T04:30:00.000Z`); // 10:00 in India
export const SEED_POSTS: Post[] = [
  ...OURS.map((p, i): Post => ({
    id: i + 1, slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category, product: p.product ?? null,
    coverImage: p.coverImage ?? null, coverAlt: p.coverAlt ?? null, body: p.body ?? '', externalUrl: null, source: null,
    author: 'DVINE H2O editorial team', seoDescription: null, featured: !!p.featured, featureOrder: p.featured ? 1 : 0, status: 'published', publishedAt: at(p.published), updatedAt: at(p.published),
  })),
];
