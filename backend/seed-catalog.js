// =================================================================
// backend/seed-catalog.js
// Seeds the default rich services catalog into content_blocks table
// under the block_key 'services.catalog.data'
// =================================================================

const { db } = require('./db');

const DEFAULT_CATALOG = [
  {
    id: 'publishing-packages',
    title: 'Publishing Packages',
    tag: 'eval-services',
    icon: 'bi-book-half',
    subcategories: [
      {
        id: 'publishing-options',
        title: 'Publishing Options',
        services: [
          {
            slug: 'basic-package',
            title: 'Basic Package',
            price: '$1,499',
            lead: 'The Basic package is designed for authors seeking core publishing needs. It includes digital formatting, paperback publishing, and customized distribution across major online retailers.',
            features: [
              'Digital formatting and distribution for e-books and paperbacks',
              'Custom cover layout and interior formatting (up to 25 image insertions)',
              'Worldwide distribution across Amazon, Barnes & Noble, and Ingram',
              'ISBN assignment, US Copyright registration, and LCCN',
              '3 complimentary author paperback copies and 12-month bookseller return program',
            ],
          },
          {
            slug: 'standard-package',
            title: 'Standard Package',
            price: '$2,199',
            lead: 'Building on the Basic, the Standard package adds hardcover publishing to enhance the physical presence and prestige of your book.',
            features: [
              'Simultaneous paperback and casebound hardcover publishing',
              'All customization, design, and global distribution features included',
              '3 paperback copies and 1 hardcover author copy',
              'Extended 36-month bookseller return program for bookstores',
              'One-on-one dedicated author publishing representative',
            ],
          },
          {
            slug: 'advanced-package',
            title: 'Advanced Package',
            price: '$3,499',
            lead: 'Our most comprehensive package, designed for authors who want extensive marketing firepower and editorial support.',
            features: [
              '20 paperback copies and 5 hardcover author copies included',
              '30 days of targeted online book advertising via Google Ads',
              'Professional book review from certified critics (Kirkus Reviews)',
              'Deluxe author promotional website setup',
              'Maximum 60-month bookseller return program flexibility',
            ],
          },
          {
            slug: 'founder-package',
            title: 'Founder Package',
            price: '$3,499',
            lead: 'Comprehensive end-to-end publishing package for ambitious authors and enterprises looking to establish industry authority.',
            features: [
              'Complete interior and cover design tailored to industry standards',
              'Worldwide distribution across major online retailers (Amazon, B&N, Ingram)',
              '100% author royalty retention program',
              'Free electronic galley proof and priority proofing cycles',
              'Dedicated senior author consultant throughout production',
            ],
          },
          {
            slug: 'pioneer-package',
            title: 'Pioneer Package',
            price: '$2,199',
            lead: 'Designed for first-time authors needing professional publishing standards at an accessible, transparent price.',
            features: [
              'Custom book cover design from professional artists',
              'Paperback formatting and digital file conversions',
              'Global distribution network setup across 40,000+ bookstores',
              '5 complimentary softcover author copies',
              'Complete copyright protection and registration assistance',
            ],
          },
          {
            slug: 'voyager-package',
            title: 'Voyager Package',
            price: '$4,799',
            lead: 'The ultimate all-inclusive publishing bundle with expansive marketing, media releases, and editorial services.',
            features: [
              'Simultaneous Softcover & Hardcover publication',
              'Comprehensive copyediting up to 75,000 words included',
              'Cinematic video book trailer production',
              'Press release creation and syndication to 200+ media outlets',
              '15 free author copies and priority shelf-ready stock',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'evaluation-services',
    title: 'Evaluation Services',
    tag: 'editorial-services',
    icon: 'bi-journal-check',
    subcategories: [
      {
        id: 'editorial-eval',
        title: 'Editorial Evaluation',
        services: [
          {
            slug: 'editorial-evaluation',
            title: 'Editorial Evaluation',
            price: 'From $499',
            lead: 'One of the key features that makes an Omni book distinct from other self-published works is our comprehensive editorial evaluation by seasoned literary editors.',
            features: [
              'Comprehensive diagnostic evaluation of your complete manuscript',
              'Detailed critique covering plot, pacing, character development, and tone',
              'Actionable editorial roadmap recommending specific editorial tracks',
              'Market readiness and commercial genre positioning assessment',
            ],
          },
          {
            slug: 'editorial-rx-referral',
            title: 'Editorial Rx Referral',
            price: '$350',
            lead: 'Diagnostic assessment pairing your manuscript with the exact editorial specialist—from line editor to book doctor—tailored to your writing style.',
            features: [
              'Deep sample edit (up to 3,000 words)',
              'Direct consultation with a senior managing editor',
              'Custom editing plan tailored to your budget and publication timeline',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'editorial-services',
    title: 'Editorial Services',
    tag: 'combined-dropdown',
    icon: 'bi-pencil-square',
    subcategories: [
      {
        id: 'advanced-editorial',
        title: 'Advanced Editorial Services',
        services: [
          {
            slug: 'developmental-editing',
            title: 'Developmental Editing',
            price: 'From $0.035 / word',
            lead: 'Substantive developmental critique evaluating structural flow, pacing, character development, and narrative arc.',
            features: [
              'Substantive chapter-by-chapter developmental critique',
              'Structural reorganization and plot arc optimization',
              'Character depth, consistency, and perspective alignment',
              'Two rounds of revisions and tracked Word markups included',
            ],
          },
          {
            slug: 'book-doctor',
            title: 'Book Doctor',
            price: 'Custom Quote',
            lead: 'Specialized intervention for stalled manuscripts, structural snags, or complex multi-genre works needing hands-on editorial surgery.',
            features: [
              'Senior book doctor assigned to dissect and repair manuscript issues',
              'Rewriting and ghost-enhancement of critical scenes and transitions',
              'Timeline and internal consistency reconciliation',
            ],
          },
        ],
      },
      {
        id: 'core-editorial',
        title: 'Core Editorial Services',
        services: [
          {
            slug: 'copyediting',
            title: 'Copyediting',
            price: 'From $0.020 / word',
            lead: 'Polishing grammar, punctuation, syntax, and flow while strictly preserving the author’s unique voice.',
            features: [
              'Comprehensive grammatical, spelling, and typographical correction',
              'Tone consistency and stylistic voice preservation',
              'Chicago Manual of Style (current edition) adherence',
              'Track changes markup provided for full author control',
            ],
          },
          {
            slug: 'line-editing',
            title: 'Line Editing',
            price: 'From $0.025 / word',
            lead: 'Sentence-level craftsmanship focusing on style, rhythm, vocabulary precision, and readability.',
            features: [
              'Clarity, conciseness, and pacing refinement',
              'Dialogue flow and emotional resonance enhancement',
              'Elimination of repetition and awkward phrasing',
            ],
          },
          {
            slug: 'proofreading',
            title: 'Proofreading',
            price: 'From $0.015 / word',
            lead: 'The vital final check before printing—eliminating typographical slips, bad breaks, and formatting inconsistencies.',
            features: [
              'Thorough final-pass review of layout proofs',
              'Catching lingering typos, punctuation errors, and word omissions',
              'Verification of page numbers, running heads, and table of contents',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'marketing-services',
    title: 'Marketing Services',
    tag: 'marketing-dropdown',
    icon: 'bi-megaphone-fill',
    subcategories: [
      {
        id: 'publicity-and-pr',
        title: 'Publicity & PR',
        services: [
          {
            slug: 'press-release-campaign',
            title: 'Press Release Campaign',
            price: '$899',
            lead: 'Get your book and author story in front of journalists, book reviewers, and targeted industry media.',
            features: [
              'Professionally crafted media release by veteran book publicists',
              'Distribution across major syndicated wire services (PR Newswire / PRWeb)',
              'Direct pitch to 50+ niche book bloggers, podcasters, and journalists',
              'Detailed clipping and media impression report with live links',
            ],
          },
          {
            slug: 'bookblast-video-marketing',
            title: 'BookBlast Video Marketing',
            price: '$1,299',
            lead: 'Engage modern readers with cinematic book trailers optimized for YouTube, Instagram Reels, and TikTok.',
            features: [
              'Cinematic 60-second video trailer with professional voiceover',
              'Optimized formats for 16:9 widescreen and 9:16 vertical shorts',
              'Social media promotional asset kit and thumbnail package',
              'Full commercial rights granted to author in perpetuity',
            ],
          },
          {
            slug: 'indie-book-review-bundle',
            title: 'Indie Book Review Bundle',
            price: '$1,499',
            lead: 'Secure verified critical reviews from established editorial review bodies to build instant reader trust.',
            features: [
              'Guaranteed editorial critique by certified review organizations',
              'Licensed quotes for cover back-matter, bookstore displays, and ads',
              'Syndication into bookstore and library acquisition catalogs',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'format-services',
    title: 'Formats & Production',
    tag: 'format-services',
    icon: 'bi-layers-fill',
    subcategories: [
      {
        id: 'specialty-formats',
        title: 'Specialty Formats',
        services: [
          {
            slug: 'hardcover-publishing',
            title: 'Hardcover Publishing',
            price: '$1,199',
            lead: 'Premium case-laminate or dust jacket hardcover editions designed for prestige and library collections.',
            features: [
              'Durable casebound or dust-jacket binding options',
              'High-resolution cover finish with premium matte or gloss lamination',
              'Library of Congress Control Number (LCCN) registration',
            ],
          },
          {
            slug: 'professional-audiobook',
            title: 'Professional Audiobook Package',
            price: '$2,499',
            lead: 'Transform your manuscript into a studio-grade audiobook narrated by professional voice talent.',
            features: [
              'Audible, Amazon, and iTunes (ACX) compliance guaranteed',
              'Auditioning and selection of SAG-AFTRA voice actors',
              'Full audio mastering, chapter splitting, and QC testing',
              'Global audiobook distribution across 30+ streaming platforms',
            ],
          },
        ],
      },
    ],
  },
];

async function seed() {
  const jsonStr = JSON.stringify(DEFAULT_CATALOG);
  const key = 'services.catalog.data';
  const label = 'Live Services Catalog';
  const editor = 'system-seed';

  const existing = await db.execute({
    sql: 'SELECT id FROM content_blocks WHERE block_key = ? LIMIT 1',
    args: [key]
  });

  if (existing.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO content_blocks (block_key, block_type, label, value, updated_by) VALUES (?, ?, ?, ?, ?)',
      args: [key, 'json', label, jsonStr, editor]
    });
    console.log('✅ Seeded services.catalog.data into content_blocks table.');
  } else {
    console.log('ℹ️ services.catalog.data already exists in content_blocks.');
  }
}

seed().catch(console.error);
