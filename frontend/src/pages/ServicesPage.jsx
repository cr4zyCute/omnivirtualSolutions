import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import './ServicesPage.css';

import DEFAULT_CATALOG from '../data/catalog.json';

// Helper to normalize and ensure full property tree for catalog objects
function formatCatalog(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((cat) => ({
    id: cat.id || cat.slug || '',
    title: cat.title || '',
    tag: cat.tag || cat.slug || '',
    icon: cat.icon || cat.icon_class || 'bi-bookmark-star',
    subcategories: (cat.subcategories || []).map((sub) => ({
      id: sub.id || sub.slug || '',
      title: sub.title || '',
      services: (sub.services || []).map((s) => ({
        slug: s.slug || '',
        title: s.title || '',
        price: s.price || s.price_display || '',
        price_display: s.price || s.price_display || '',
        lead: s.lead || s.lead_paragraph || '',
        lead_paragraph: s.lead || s.lead_paragraph || '',
        features: Array.isArray(s.features) && s.features.length > 0 ? s.features : [
          'Full editorial and publishing consultation',
          'Dedicated project manager assignment',
          '100% author rights and royalty retention',
        ],
      })),
    })),
  }));
}

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const openParam = searchParams.get('open');
  const serviceParam = searchParams.get('service');
  const { t, blocks, company } = useCms();

  const [catalog, setCatalog] = useState(() => {
    if (blocks && blocks['services.catalog.data']) {
      try {
        const parsed = typeof blocks['services.catalog.data'] === 'string'
          ? JSON.parse(blocks['services.catalog.data'])
          : blocks['services.catalog.data'];
        const formatted = formatCatalog(parsed);
        if (formatted.length > 0) return formatted;
      } catch (_) {}
    }
    return DEFAULT_CATALOG;
  });

  const [selectedService, setSelectedService] = useState(null);
  const [activeCategoryTag, setActiveCategoryTag] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({ 'eval-services': true });
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  // Toggle subcategory expansion accordion
  const toggleSubcategoryAccordion = (subId, e, defaultOpen = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedSubcategories((prev) => {
      const isCurrentOpen = prev[subId] !== undefined ? prev[subId] : defaultOpen;
      return { ...prev, [subId]: !isCurrentOpen };
    });
  };

  // Helper to synchronously update both catalog tree and currently selected service object
  const updateCatalogAndSelected = (rawCatalog) => {
    const formatted = formatCatalog(rawCatalog);
    if (!formatted.length) return;
    setCatalog(formatted);
    setSelectedService((current) => {
      if (!current) return formatted[0]?.subcategories?.[0]?.services?.[0] || null;
      for (const cat of formatted) {
        for (const sub of (cat.subcategories || [])) {
          for (const s of (sub.services || [])) {
            if (s.slug === current.slug) {
              return {
                ...s,
                categoryId: cat.id,
                categoryTitle: cat.title,
                subcategoryId: sub.id,
                subcategoryTitle: sub.title,
                categoryTag: cat.tag,
              };
            }
          }
        }
      }
      const fallback = formatted[0]?.subcategories?.[0]?.services?.[0];
      if (fallback) {
        return {
          ...fallback,
          categoryId: formatted[0].id,
          categoryTitle: formatted[0].title,
          subcategoryId: formatted[0].subcategories[0]?.id,
          subcategoryTitle: formatted[0].subcategories[0]?.title,
          categoryTag: formatted[0].tag,
        };
      }
      return null;
    });
  };

  // Sync whenever blocks['services.catalog.data'] updates from universal CmsContext
  useEffect(() => {
    if (blocks && blocks['services.catalog.data']) {
      try {
        const parsed = typeof blocks['services.catalog.data'] === 'string'
          ? JSON.parse(blocks['services.catalog.data'])
          : blocks['services.catalog.data'];
        if (Array.isArray(parsed) && parsed.length > 0) {
          updateCatalogAndSelected(parsed);
        }
      } catch (_) {}
    }
  }, [blocks ? blocks['services.catalog.data'] : null]);

  // Initial fetch of live catalog from backend API
  useEffect(() => {
    fetch('/api/v1/services')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.catalog && data.catalog.length > 0) {
          updateCatalogAndSelected(data.catalog);
        }
      })
      .catch(() => {});
  }, []);

  // Real-time SSE updates from CMS editor directly
  useEffect(() => {
    let es = null;
    try {
      es = new EventSource('/api/v1/live');
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'cms_block_updated' && payload.key === 'services.catalog.data') {
            const rawCat = typeof payload.value === 'string' ? JSON.parse(payload.value) : payload.value;
            if (Array.isArray(rawCat) && rawCat.length > 0) {
              updateCatalogAndSelected(rawCat);
            }
          } else if (payload.type === 'service_updated' && payload.key && payload.value) {
            const slug = payload.key.replace(/^service\./, '');
            setSelectedService((current) => {
              if (!current || current.slug !== slug) return current;
              return {
                ...current,
                title: payload.value.title !== undefined ? payload.value.title : current.title,
                price: payload.value.price_display || payload.value.price || current.price,
                price_display: payload.value.price_display || payload.value.price || current.price,
                lead: payload.value.lead_paragraph || payload.value.lead || current.lead,
                lead_paragraph: payload.value.lead_paragraph || payload.value.lead || current.lead,
                features: Array.isArray(payload.value.features) ? payload.value.features : current.features,
              };
            });
            setCatalog((prev) =>
              prev.map((cat) => ({
                ...cat,
                subcategories: (cat.subcategories || []).map((sub) => ({
                  ...sub,
                  services: (sub.services || []).map((s) => {
                    if (s.slug !== slug) return s;
                    return {
                      ...s,
                      title: payload.value.title !== undefined ? payload.value.title : s.title,
                      price: payload.value.price_display || payload.value.price || s.price,
                      price_display: payload.value.price_display || payload.value.price || s.price,
                      lead: payload.value.lead_paragraph || payload.value.lead || s.lead,
                      lead_paragraph: payload.value.lead_paragraph || payload.value.lead || s.lead,
                      features: Array.isArray(payload.value.features) ? payload.value.features : s.features,
                    };
                  }),
                })),
              }))
            );
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (es) es.close();
    };
  }, []);

  // Synchronize individual service block overrides in real-time only if catalog didn't already supply value
  useEffect(() => {
    setSelectedService((current) => {
      if (!current || !blocks) return current;
      const slug = current.slug;
      const titleOverride = blocks[`service.${slug}.title`];
      const priceOverride = blocks[`service.${slug}.price`] || blocks[`service.${slug}.price_display`];
      const leadOverride = blocks[`service.${slug}.desc`] || blocks[`service.${slug}.lead`];
      const featOverride = blocks[`service.${slug}.features`];

      let changed = false;
      const updated = { ...current };

      if (titleOverride && !current.title) {
        updated.title = titleOverride;
        changed = true;
      }
      if (priceOverride && !current.price) {
        updated.price = priceOverride;
        updated.price_display = priceOverride;
        changed = true;
      }
      if (leadOverride && !current.lead) {
        updated.lead = leadOverride;
        updated.lead_paragraph = leadOverride;
        changed = true;
      }
      if (featOverride !== undefined && (!current.features || current.features.length === 0)) {
        const parsedFeats = Array.isArray(featOverride)
          ? featOverride
          : (typeof featOverride === 'string' ? JSON.parse(featOverride) : null);
        if (Array.isArray(parsedFeats)) {
          updated.features = parsedFeats;
          changed = true;
        }
      }

      return changed ? updated : current;
    });
  }, [blocks]);

  // Flatten all services for quick lookup and navigation
  const allServicesList = useMemo(() => {
    const list = [];
    catalog.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        sub.services.forEach((s) => {
          list.push({ ...s, categoryId: cat.id, categoryTitle: cat.title, subcategoryId: sub.id, subcategoryTitle: sub.title, categoryTag: cat.tag });
        });
      });
    });
    return list;
  }, [catalog]);

  // Handle URL deep-linking or initial selection
  useEffect(() => {
    if (serviceParam && allServicesList.length > 0) {
      const found = allServicesList.find((s) => s.slug === serviceParam);
      if (found) {
        setSelectedService(found);
        setActiveCategoryTag(found.categoryTag);
        setExpandedCategories((prev) => ({ ...prev, [found.categoryTag]: true }));
        return;
      }
    }

    if (openParam) {
      setActiveCategoryTag(openParam);
      setExpandedCategories((prev) => ({ ...prev, [openParam]: true }));
      const catMatch = catalog.find((c) => c.tag === openParam);
      if (catMatch && catMatch.subcategories[0]?.services[0]) {
        setSelectedService({
          ...catMatch.subcategories[0].services[0],
          categoryId: catMatch.id,
          categoryTitle: catMatch.title,
          subcategoryId: catMatch.subcategories[0].id,
          subcategoryTitle: catMatch.subcategories[0].title,
          categoryTag: catMatch.tag,
        });
        return;
      }
    }

    if (!selectedService && allServicesList.length > 0) {
      setSelectedService(allServicesList[0]);
    } else if (selectedService) {
      const refreshed = allServicesList.find((s) => s.slug === selectedService.slug);
      if (refreshed) {
        setSelectedService(refreshed);
      }
    }
  }, [openParam, serviceParam, allServicesList, catalog]);

  // Scroll to top on initial page mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Dynamic header, labels, and CTA bound directly to CMS t()
  const headerTitle = t('services.header.title', 'Omni Services Catalog');
  const headerSubtitle = t('services.header.subtitle', 'Explore our full spectrum of publishing, editorial, and author marketing solutions.');
  const badgeText = t('services.badge.text', 'Omni Specialist Service');
  const priceSubText = t('services.price.sub', 'Transparent Pricing');
  const overviewHeading = t('services.overview.heading', 'Service Overview');
  const includedHeading = t('services.included.heading', 'Begin your publishing journey with the package that lets you take the extra mile.');
  const ctaSubtitle = t('services.cta.subtitle', 'Get a free consultation, custom quote, and turnaround timeline today.');
  const ctaBtnText = t('services.cta.btn_text', 'Inquire About This Service');
  const ctaEmail = t('services.cta.email', t('footer.email', company?.email || company?.recipient_email || 'admin@omnivirtualsolution.com'));

  const publishingOptionsTitle = t('service.publishing-options.title', 'Publishing Options');
  const publishingOptionsDesc = t('service.publishing-options.desc', 'Our packages offer various combinations of our publishing, editorial, and marketing services for a truly customized publishing experience. With Omni, you can choose the package that best suits your literary goals.');

  const publishingPackagesList = useMemo(() => {
    const defaultPkgs = [
      {
        slug: 'basic-package',
        title: 'Basic Package',
        price: '$899.00',
        summary: 'The Basic package is designed for authors seeking basic publishing needs. It includes digital formatting and distribution for e-books, paperback publishing, and customization options for the interior and cover.',
      },
      {
        slug: 'standard-package',
        title: 'Standard Package',
        price: '$1,599.00',
        summary: 'Building on the Basic, the Standard package adds hardcover publishing to the mix, enhancing the physical presence of your book. This package maintains all the services of the Basic package, including the customization, support, and online distribution features.',
      },
      {
        slug: 'advanced-package',
        title: 'Advanced Package',
        price: '$4,999.00',
        summary: 'The Advanced package is the most comprehensive, designed for authors who want extensive support and marketing tools. It includes everything from the Standard package, but boosts the number of copies provided to 20 paperbacks and 5 hardcovers.',
      },
    ];

    return defaultPkgs.map((dp) => {
      const liveSvc = allServicesList.find((s) => s.slug === dp.slug);
      return {
        slug: dp.slug,
        title: liveSvc?.title || t(`service.${dp.slug}.title`, dp.title),
        price: liveSvc?.price || liveSvc?.price_display || t(`service.${dp.slug}.price`, dp.price),
        summary: liveSvc?.lead || liveSvc?.lead_paragraph || t(`service.${dp.slug}.summary`, t(`service.${dp.slug}.lead`, dp.summary)),
      };
    });
  }, [allServicesList, t]);

// Descriptions for each subcategory shown on category overview cards
const SUBCATEGORY_DESCRIPTIONS = {
  'publishing-options': 'Our packages offer various combinations of publishing, editorial, and marketing services for a truly customized publishing experience.',
  'editorial-evaluation': 'Manuscript diagnostic checkup, detailed observations report on narrative strengths, and $299 credit toward editorial services.',
  'core-editorial-services': 'Focus on improving the nuts and bolts of your book: grammar, spelling, punctuation, capitalization, and sentence structure.',
  'advanced-editorial-services': 'Specialized attention beyond grammar: comprehensive developmental editing, story architecture, and book doctoring.',
  'author-assistance-editorial-services': 'Professional guidance during crucial revision stages, including Quality Reviews and dedicated Editorial Assistants.',
  'cover-copy-polish': 'Compelling back cover copy and marketing descriptions crafted by experienced copywriters to clinch the sale.',
  'proofreading': 'Final pre-publication review to catch lingering typos and layout glitches before your book goes to print.',
  'indexing': 'Professional manual and keyword indexing to maximize reader usability and library adoption of nonfiction titles.',
  'electronic-format': 'Flawless reflowable e-book conversion and worldwide digital distribution to Kindle, Apple Books, and Nook.',
  'audiobook-publishing': 'Lift your story from its pages with Do-It-Yourself and full-cast Professional Audiobook production.',
  'print-formats': 'Trade softcover and deluxe cloth-bound hardcover publishing printed on acid-free, book-grade opaque stock.',
  'interior-page-layout': 'Elite typography, custom headers, image insertions, and Chicago Manual of Style citation formatting.',
  'cover-design': 'Commercial bookstore-grade full-color cover design, artwork revisions, and custom illustrations.',
  'stock-images': 'Access to millions of premium high-resolution images from Getty Images for your cover and interior.',
  'black-and-white-illustrations': 'Custom black-and-white artwork created by seasoned in-house studio artists to enrich your text.',
  'color-illustrations': 'Vibrant, hand-crafted color illustrations tailored for children’s books, graphic novels, and memoirs.',
  'pre-manuscript-services': 'Data entry, manuscript file conversion, scanning, and structural formatting corrections prior to design.',
  'post-page-layout-services': 'Text changes, layout corrections, and interior revisions after initial book proofs are generated.',
  'resubmission': 'Update editions, correct errors, and refresh files for live published books across global retail channels.',
  'author-and-book-videos': 'Cinematic book video trailers and professional author interviews that captivate online audiences visually.',
  'publicity-services': 'Compelling press releases distributed to over 500 media outlets, opt-in journalists, and newsrooms.',
  'book-reviews': 'Elevate your credibility with authoritative reviews from respected literary reviewers that readers trust.',
  'book-signings-and-galleries': 'Exhibition space at premier literary festivals including the LA Times Festival of Books and national shows.',
  'hollywood-book-to-screen': 'Professional coverage, treatments, and screenplays to position your book for film and television adaptation.',
  'internet-marketing': 'Search engine marketing (SEM), Google display ads, social media campaigns, and custom author websites.',
  'radio-services': 'Broadcast interviews with Emmy Award-winning host Kate Delaney and syndicated literary podcasts.',
  'advertising': 'Targeted cooperative advertising campaigns across Ingram and holiday gift guides.',
  'genre-specific-marketing': 'Targeted marketing outreach specifically designed for specialized genres and niche reader communities.',
  'bookstore-essentials': 'Make your book returnable for bookstores, set your own retail price and royalties, and access bookstore pitching.',
  'registration': 'Protect your work with official U.S. Copyright Office registration and secure a Library of Congress Control Number.'
};

// Exact authentic subcategory leads from services.html
const SUBCATEGORY_LEADS = {
  'publishing-options': 'Our packages offer various combinations of our publishing, editorial, and marketing services for a truly customized publishing experience. With Omni, you can choose the package that best suits your literary goals.',
  'editorial-evaluation': 'The Editorial Evaluation is a manuscript checkup that assesses your work to be sure that it has fulfilled the basic requirements of a published book. The editorial evaluator will not only provide you with a general overview of your manuscript but will also educate you through constructive comments on how to write a better book.',
  'advanced-editorial-services': "Sometimes manuscripts need specialized attention that goes beyond detail work in grammar, spelling, and punctuation. Our experienced editors take an in-depth look at your book's content and other high-level stylistic considerations, including content, plot, and pace. Services include Developmental Editing, Book Doctoring, Ghostwriting, and Ghostwriting Estimate and Sample.",
  'author-assistance-editorial-services': 'While all of our Editorial Services aim to assist authors, this category of services takes an extra step, providing professional guidance to authors during the crucial revision stage following a core editorial service. Services include a Quality Review and an Editorial Assistant as an add-on to all of our Core and Advanced Editorial Services. Plus, Researching is available to those authors who need help gathering facts, such as for historical works or memoirs. For more information on Author Assistance Editorial Services, refer to the following form, which is used to provide additional information for the Editorial Assistant before work can begin on your manuscript: Editorial Assistant Form (.doc, 93KB)',
  'core-editorial-services': 'Core editing services focus on improving the nuts and bolts of a book: grammar, spelling, punctuation, capitalization, and sentence structure. Services include Copyediting, Line Editing, Content Editing, and Content Editing Plus.',
  'cover-copy-polish': 'With Omni Cover Copy Polish, ideas you provide allow us to create intriguing copy that can help you clinch the sale.',
  'indexing': 'To maximize the usability of a nonfiction title, readers, book buyers, librarians, and reviewers will expect you to include an index in your book. You can even sell your book to readers by the index.',
  'proofreading': 'Our proofreading and revisions services can help save you from embarrassment and costly corrections after publication.',
  'audiobook-publishing': 'Over the years, the demand for audiobooks has significantly increased because readers are now able to easily download books and listen to them while they are on the move. Through audiobooks, stories are shared in a convenient way. Let your words unfold in your readers’ imagination through Omni audiobook publishing. Lift your story from its pages and let your readers listen to it.',
  'print-formats': 'All manuscripts submitted to Omni are formatted as trade paperbacks and printed on high-quality, acid-free, book-grade opaque paper stock.',
  'black-and-white-illustrations': 'Elevate your book to the next creative level with custom artwork produced in our in-house art studio. The Omni team of seasoned studio artists will work with you to produce striking black-and-white illustrations that add visual interest to your book’s content.',
  'color-illustrations': "One of Omni's talented studio artists will use your descriptions and feedback to create custom color illustrations that reflect your book’s unique style.",
  'cover-design': "The cover is the first opportunity you have to connect with potential readers. That's why at Omni we make sure that your cover will meet the professional standards for commercially successful books. After all, when a book is sitting on the shelf, potential readers don't look to see how a book is published. They only know whether the cover image draws their attention or the back cover copy makes them want to read more. These elements make a great cover, and that is why we pay attention to these details when we are publishing your book.",
  'interior-page-layout': 'Careful planning and execution of the layout of your book is very important. Readers need to be able to easily follow the text of your book. Our professionals will help you create the best layout for your book.',
  'stock-images': 'All books published via the Omni standard publishing packages receive custom-designed covers, produced in full color. Within the realm of this custom-designed cover, you have the option to choose two images, free of charge, from the millions found through Getty Images. If you wish to include more than two images on your cover, a Stock Image Processing fee will be assessed.',
  'post-page-layout-services': 'Omni allows you to make changes to your book after the manuscript has been laid out by our designers. Charges will be applied.',
  'pre-manuscript-services': 'Preparing your manuscript for submission and for publishing is a whole lot easier when we do it for you. Omni can convert your typewritten manuscript, or previously published book, to a word-processed format.',
  'resubmission': 'Once your book has gone live and is for sale, you can still correct errors or other issues that might have been missed. Resubmission services are available for a fee.',
  'video-book-trailer': 'REASONS WHY VIDEO BOOK TRAILERS ARE ESSENTIAL: A book video trailer combines visuals, text, music, and voiceovers, making it appealing to people who prefer video content over traditional text-based marketing. Videos rank well on search engines and social media platforms, increasing discoverability.',
  'book-reviews': 'A book review is an excellent way to generate interest for your title. Book readers, buyers, and retailers rely on the opinion of experts when considering which titles are worth purchasing and reading. Omni offers four distinct review services to help you elevate your book’s credibility and raise its marketing potential.',
  'book-signings-and-galleries': "A book exhibition or book signing event can be a terrific way to create buzz around your book. As an exhibitor at many of the largest trade shows and book events, we've put our books in the hands of booklovers and industry insiders through Omni book exhibition services.",
  'hollywood-book-to-screen': 'Have you ever considered for even a moment that your book could be adapted into a movie or television series? If the answer is yes, then Omni can make your book available to agents, producers, directors, writers, and actors through multiple services available to our authors.',
  'internet-marketing': 'Having your own website, internet search, or preview tools are effective and economical ways to promote your book, enhance your image as an author, and communicate with prospective readers around the world.',
  'publicity-services': 'Get your book noticed from a unique platform created by our publicity and media services. When done right, a press release is an effective way to get publicity and build media relationships.',
  'radio-services': 'Have you ever considered how a radio interview might affect your book’s marketing plan? If the answer is yes, then Omni can make your voice available on the airwaves to help you reach new audiences and further your cause.',
  'bookstore-essentials': 'Through Omni Bookstore Essentials, your book receives professional bookselling services that make your book even more attractive to bookstores. By making your book returnable or adding preview services to your book, bookstores and other book buyers receive additional incentives to stock or purchase your book.',
  'registration': 'As you make your work available to the public, you want to make sure you have the appropriate protection. There are two ways we can help you with that. The first is registering your copyright with the U.S. Copyright Office. Second, a Library of Congress Control Number makes your book more accessible to librarians and book vendors.'
};

// Authentic service summaries when displayed inside a subcategory overview (matching services.html)
const AUTHENTIC_SERVICE_SUMMARIES = {
  'developmental-editing': 'The Omni Developmental Editing service combines three editorial services into one package: First, a developmental editor evaluates the manuscript at the paragraph, chapter, and book levels and makes suggestions throughout the manuscript to identify big-picture areas that need work. Second, the content editor will check the manuscript for errors in grammar, spelling, and punctuation. And third, the manuscript will receive a quality review to ensure the manuscript is editorially sound before it goes into production.',
  'book-doctor': 'A book doctor makes the changes recommended by an Omni developmental editor after you approve the suggested revisions.',
  'small-book-review-with-editing-under-5-000-words': 'Our editors carefully review your full manuscript (under 5,000 words) and provide you with the edits best suited to your book. This all-inclusive service is a combination of our Editorial Assessment, Line Editing and Content Editing services.',
  'copyediting': 'An experienced editor will correct errors in spelling, grammar, and punctuation in your manuscript.',
  'line-editing': 'An editorial specialist will not only check your manuscript for more pervasive errors in spelling, grammar and punctuation, but also will make suggestions regarding sentence structure and word choice.',
  'content-editing': 'The Content Editing service provides extensive restructuring for manuscripts that need more attention than Line Editing provides.',
  'content-editing-plus': 'This service is ideal for manuscripts that need more work on sentence structure and grammar than basic Content Editing can provide.',
  'cover-copy-polish': 'With Omni Cover Copy Polish, ideas you provide allow us to create intriguing copy that can help you clinch the sale.',
  'professional-indexing': "Our professional indexers will provide you with an industry-standard, two-level topical index that is personalized to provide maximum usability for the book's target audience. The professional indexer analyzes your entire book, anticipating line items your reader will most likely want to find and listing them in an intuitive, accessible manner. This high-quality index is the standard found throughout the publishing industry."
};

  // Active selected service display values: catalog data is source of truth, fallback to CMS t()
  const displayTitle = selectedService ? (selectedService.title || t(`service.${selectedService.slug}.title`, '')) : '';
  const displayPrice = selectedService ? (selectedService.price || selectedService.price_display || t(`service.${selectedService.slug}.price`, '')) : '';
  const displayLead = selectedService ? (selectedService.lead || selectedService.lead_paragraph || t(`service.${selectedService.slug}.lead`, '')) : '';
  const ctaHeading = t('services.cta.heading', selectedService ? `Ready to start with ${displayTitle}?` : 'Ready to get started?');

  // Find the parent category for the current selected service
  const selectedCategory = useMemo(() => {
    if (!selectedService) return null;
    return catalog.find((c) => c.id === selectedService.slug || c.id === selectedService.categoryId || c.tag === selectedService.categoryTag) || null;
  }, [selectedService, catalog]);

  // Determine if currently selected item is a Category Overview
  const isCurrentCategoryOverview = useMemo(() => {
    if (!selectedService || !selectedCategory) return false;
    return selectedService.slug === selectedCategory.id;
  }, [selectedService, selectedCategory]);

  // Find the current subcategory
  const currentSubcategory = useMemo(() => {
    if (!selectedService || !selectedCategory) return null;
    return (selectedCategory.subcategories || []).find((sub) => sub.id === selectedService.slug || sub.id === selectedService.subcategoryId) || null;
  }, [selectedService, selectedCategory]);

  // Determine if currently selected item is a Subcategory Overview
  const isCurrentSubcategoryOverview = useMemo(() => {
    if (!selectedService || !currentSubcategory) return false;
    return Boolean(selectedService.isSubcategoryOverview || (selectedService.slug === currentSubcategory.id && selectedService.slug !== selectedCategory?.id));
  }, [selectedService, selectedCategory, currentSubcategory]);

  const displayFeatures = useMemo(() => {
    if (!selectedService) return [];
    let feats = selectedService.features || [];
    const override = blocks ? blocks[`service.${selectedService.slug}.features`] : null;
    if (Array.isArray(override)) feats = override;
    else if (typeof override === 'string') {
      try {
        const parsed = JSON.parse(override);
        if (Array.isArray(parsed)) feats = parsed;
      } catch (_) {}
    }
    // Clean and sanitize checklist bullets: never allow full paragraphs, quotes, or author attributions inside feature check boxes
    return feats.filter((f) => {
      if (!f || typeof f !== 'string') return false;
      const trimmed = f.trim();
      if (trimmed.startsWith('—') || trimmed.startsWith('-') || trimmed.startsWith('"') || trimmed.startsWith('“')) return false;
      if (trimmed.toLowerCase().includes('author of')) return false;
      if (trimmed.length > 130) return false;
      return true;
    });
  }, [selectedService, blocks]);

  // Select a subcategory overview
  const handleSelectSubcategory = (cat, sub) => {
    setExpandedCategories((prev) => ({ ...prev, [cat.tag]: true, [cat.id]: true }));
    setExpandedSubcategories((prev) => ({ ...prev, [sub.id]: true }));

    const subLead = SUBCATEGORY_LEADS[sub.id] || SUBCATEGORY_DESCRIPTIONS[sub.id] || sub.lead || `Explore all specialized services under ${sub.title}.`;
    const subServices = (sub.services || []).filter(s => s.slug !== cat.id && s.slug !== sub.id);

    setSelectedService({
      slug: sub.id,
      title: sub.title,
      isSubcategoryOverview: true,
      categoryId: cat.id,
      categoryTitle: cat.title,
      subcategoryId: sub.id,
      subcategoryTitle: sub.title,
      categoryTag: cat.tag,
      lead: subLead,
      services: subServices,
      features: [
        `Dedicated specialist support across all ${sub.title} offerings`,
        'Professional project consultation and turnaround management',
        'Transparent pricing and author royalty retention',
        'Full compliance with industry publishing standards'
      ]
    });

    setDrawerOpen(false);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Jump from category overview card into a specific subcategory
  const handleJumpToSubcategory = (targetCat, targetSub) => {
    handleSelectSubcategory(targetCat, targetSub);
  };

  // Copy email
  const handleCopyEmail = (e) => {
    e?.preventDefault?.();
    const email = ctaEmail || 'admin@omnivirtualsolution.com';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {}
      document.body.removeChild(textarea);
    }
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2200);
  };

  // Toggle category expansion
  const toggleCategoryAccordion = (tag) => {
    setExpandedCategories((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  const handleSelectService = (service, cat, sub) => {
    const subId = sub?.id || service.subcategoryId;
    if (subId) {
      setExpandedSubcategories((prev) => ({ ...prev, [subId]: true }));
    }
    const catId = cat?.id || service.categoryId;
    const catTag = cat?.tag || service.categoryTag;
    if (catTag) {
      setExpandedCategories((prev) => ({ ...prev, [catTag]: true, [catId]: true }));
    }
    setSelectedService({
      ...service,
      categoryId: catId,
      categoryTitle: cat?.title || service.categoryTitle,
      subcategoryId: subId,
      subcategoryTitle: sub?.title || service.subcategoryTitle,
      categoryTag: catTag,
    });
    setDrawerOpen(false);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Find previous & next services for convenient mobile navigation
  const currentIndex = useMemo(() => {
    if (!selectedService) return -1;
    return allServicesList.findIndex((s) => s.slug === selectedService.slug);
  }, [selectedService, allServicesList]);

  const prevService = currentIndex > 0 ? allServicesList[currentIndex - 1] : null;
  const nextService = currentIndex < allServicesList.length - 1 ? allServicesList[currentIndex + 1] : null;

  // Filter catalog based on active category pill and search query
  const filteredCatalog = useMemo(() => {
    return catalog
      .filter((cat) => activeCategoryTag === 'all' || cat.tag === activeCategoryTag)
      .map((cat) => ({
        ...cat,
        subcategories: cat.subcategories
          .map((sub) => ({
            ...sub,
            services: sub.services.filter(
              (s) =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.lead.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter((sub) => sub.services.length > 0),
      }))
      .filter((cat) => cat.subcategories.length > 0);
  }, [catalog, activeCategoryTag, searchQuery]);

  return (
    <div className="services-page-wrapper">
      <main className="main services-catalog-page">
        <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 clamp(16px, 3vw, 24px)' }}>
          
          {/* Top Header Bar (Centered) */}
          <div className="services-top-bar text-center">
            <h1 className="services-main-title text-center" data-block-key="services.header.title">
              {headerTitle}
            </h1>
            <p className="services-subtitle text-center mx-auto" style={{ maxWidth: '640px' }} data-block-key="services.header.subtitle">
              {headerSubtitle}
            </p>

            {/* Search & Mobile Drawer Trigger Bar */}
            <div className="services-control-bar">
              <div className="services-search-wrap">
                <i className="bi bi-search services-search-icon"></i>
                <input
                  type="text"
                  className="services-search-input"
                  placeholder="Search all services, packages, editorial..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search services"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#8a827a',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>

              {/* Mobile Categories Button */}
              <button
                type="button"
                className="drawer-trigger-btn d-lg-none"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open categories menu"
              >
                <i className="bi bi-grid-fill"></i>
                <span>Categories</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Desktop Sidebar + Right Detail Card */}
          <div className="row g-4">
            
            {/* Desktop Persistent Sidebar */}
            <div className="col-lg-4 d-none d-lg-block">
              <div className="desktop-services-sidebar">
                <div className="sidebar-brand-box d-flex align-items-center justify-content-between">
                  <span className="fw-bold">
                    <i className="bi bi-folder2-open me-2" style={{ color: '#d8aa71' }}></i>
                    All Categories ({catalog.length})
                  </span>
                  <span className="badge rounded-pill bg-dark text-warning border border-warning" style={{ fontSize: '0.72rem' }}>
                    Live Catalog
                  </span>
                </div>

                <div>
                  {catalog.map((cat) => {
                    const isExpanded = expandedCategories[cat.id] || expandedCategories[cat.tag] || activeCategoryTag === cat.tag || activeCategoryTag === cat.id || searchQuery.length > 0;
                    const totalCount = cat.subcategories.reduce(
                      (acc, sub) => acc + (sub.services || []).filter((s) => s.slug !== cat.id).length,
                      0
                    );
                    const catTitle = t(`service.${cat.id}.title`, cat.title);
                    const isCatOverviewSelected = selectedService?.slug === cat.id;

                    return (
                      <div key={cat.id} className="sidebar-category-group">
                        <div className="d-flex align-items-center justify-content-between category-header-row">
                          <button
                            type="button"
                            className={`category-accordion-btn ${isExpanded ? 'expanded' : ''} ${isCatOverviewSelected ? 'active-category' : ''}`}
                            onClick={() => {
                              toggleCategoryAccordion(cat.tag);
                              const catOverviewSvc = allServicesList.find((s) => s.slug === cat.id);
                              if (catOverviewSvc) {
                                handleSelectService(
                                  {
                                    ...catOverviewSvc,
                                    title: catOverviewSvc.title || t(`service.${catOverviewSvc.slug}.title`, cat.title),
                                    lead: catOverviewSvc.lead || catOverviewSvc.lead_paragraph || t(`service.${catOverviewSvc.slug}.lead`, ''),
                                  },
                                  cat,
                                  cat.subcategories[0]
                                );
                              } else if (cat.subcategories[0]?.services[0]) {
                                const targetSvc = cat.subcategories[0].services[0];
                                handleSelectService({ ...targetSvc, title: targetSvc.title || t(`service.${targetSvc.slug}.title`, '') }, cat, cat.subcategories[0]);
                              }
                            }}
                          >
                            <span className="d-flex align-items-center gap-2">
                              <i className={`bi ${cat.icon}`} style={{ color: '#ad7d42' }}></i>
                              <span className="cat-title-text" data-block-key={`service.${cat.id}.title`}>
                                {catTitle}
                              </span>
                            </span>
                            <span className="d-flex align-items-center gap-2">
                              <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                                {totalCount}
                              </span>
                              <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} small`}></i>
                            </span>
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="subcategories-list">
                            {cat.subcategories.map((sub) => {
                              const subTitle = t(`service.${sub.id}.title`, sub.title);
                              const filteredServices = (sub.services || []).filter(
                                (svc) => svc.slug !== cat.id
                              );
                              if (filteredServices.length === 0) return null;

                              const defaultSubOpen =
                                selectedService?.subcategoryId === sub.id ||
                                filteredServices.some((s) => s.slug === selectedService?.slug) ||
                                cat.subcategories.length === 1 ||
                                searchQuery.length > 0;

                              const isSubExpanded =
                                expandedSubcategories[sub.id] !== undefined
                                  ? expandedSubcategories[sub.id]
                                  : defaultSubOpen;

                              const isSubOverviewSelected = selectedService?.slug === sub.id;

                              return (
                                <div key={sub.id} className="subcategory-group mb-2">
                                  <button
                                    type="button"
                                    className={`subcategory-dropdown-btn ${isSubExpanded ? 'expanded' : ''} ${isSubOverviewSelected ? 'active-subcategory' : ''}`}
                                    onClick={() => handleSelectSubcategory(cat, sub)}
                                    aria-expanded={isSubExpanded}
                                  >
                                    <span className="subcategory-label-text" data-block-key={`service.${sub.id}.title`}>
                                      {subTitle}
                                    </span>
                                    <span className="d-flex align-items-center gap-1">
                                      <span className="subcat-count-badge">
                                        {filteredServices.length}
                                      </span>
                                      <span
                                        className="subcat-toggle-chevron-btn"
                                        title={isSubExpanded ? "Collapse" : "Expand"}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSubcategoryAccordion(sub.id, e, defaultSubOpen);
                                        }}
                                      >
                                        <i className={`bi bi-chevron-${isSubExpanded ? 'down' : 'right'} subcat-chevron`}></i>
                                      </span>
                                    </span>
                                  </button>

                                  {isSubExpanded && (
                                    <div className="subcategory-services-list">
                                      {filteredServices.map((svc) => {
                                        const isSelected = selectedService?.slug === svc.slug;
                                        const svcTitle = t(`service.${svc.slug}.title`, svc.title);
                                        return (
                                          <button
                                            key={svc.slug}
                                            type="button"
                                            className={`service-nav-item ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleSelectService({ ...svc, title: svcTitle }, cat, sub)}
                                          >
                                            <span className="text-truncate" data-block-key={`service.${svc.slug}.title`}>{svcTitle}</span>
                                            {isSelected && <i className="bi bi-check2"></i>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Presentation Detail Column */}
            <div className="col-lg-8">
              {selectedService ? (
                <div className="service-detail-card">
                  {/* Breadcrumbs */}
                  <div className="service-breadcrumb">
                    <span>Services</span>
                    <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                    <span 
                      style={{ cursor: selectedCategory ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (selectedCategory) {
                          const catOverviewSvc = allServicesList.find((s) => s.slug === selectedCategory.id);
                          if (catOverviewSvc) {
                            handleSelectService(
                              {
                                ...catOverviewSvc,
                                title: catOverviewSvc.title || t(`service.${catOverviewSvc.slug}.title`, selectedCategory.title),
                                lead: catOverviewSvc.lead || catOverviewSvc.lead_paragraph || t(`service.${catOverviewSvc.slug}.lead`, ''),
                              },
                              selectedCategory,
                              selectedCategory.subcategories?.[0]
                            );
                          }
                        }
                      }}
                    >
                      {selectedCategory?.title || selectedService.categoryTitle || 'Publishing'}
                    </span>
                    {isCurrentSubcategoryOverview && (
                      <>
                        <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                        <span className="text-dark fw-semibold" data-block-key={selectedService ? `service.${selectedService.slug}.title` : undefined}>{displayTitle}</span>
                      </>
                    )}
                    {!isCurrentCategoryOverview && !isCurrentSubcategoryOverview && (
                      <>
                        {currentSubcategory && (
                          <>
                            <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                            <span 
                              style={{ cursor: 'pointer' }}
                              onClick={() => selectedCategory && handleSelectSubcategory(selectedCategory, currentSubcategory)}
                            >
                              {currentSubcategory.title}
                            </span>
                          </>
                        )}
                        <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                        <span className="text-dark fw-semibold" data-block-key={selectedService ? `service.${selectedService.slug}.title` : undefined}>{displayTitle}</span>
                      </>
                    )}
                  </div>

                  {/* Header row: Badge, Title & Price */}
                  <div>
                    <div className="service-tag-badge">
                      <i className="bi bi-award-fill"></i>
                      <span data-block-key={(isCurrentCategoryOverview || isCurrentSubcategoryOverview) ? undefined : "services.badge.text"}>
                        {isCurrentCategoryOverview ? 'Omni Category Overview' : isCurrentSubcategoryOverview ? 'Omni Subcategory Overview' : badgeText}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline gap-3 flex-wrap">
                      <h2 className="service-title m-0" data-block-key={selectedService ? `service.${selectedService.slug}.title` : undefined}>
                        {displayTitle}
                      </h2>
                      {displayPrice && (
                        <div className="service-package-price-display m-0">
                          <span 
                            className="service-price-amount"
                            data-block-key={selectedService ? `service.${selectedService.slug}.price` : undefined}
                            style={{ display: 'inline-block', minWidth: '50px' }}
                          >
                            {displayPrice}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="service-divider" />

                  {/* Service Overview Box */}
                  <div className="service-lead-box">
                    <h5 data-block-key="services.overview.heading">{overviewHeading}</h5>
                    <p className="service-lead-text" data-block-key={selectedService ? `service.${selectedService.slug}.lead` : undefined}>
                      {displayLead}
                    </p>
                  </div>

                  {/* Bottom section: Specific layout for Publishing Packages, Evaluation Services, Editorial Evaluation, or What's Included */}
                  {selectedService?.slug === 'publishing-packages' ? (
                    <div className="publishing-options-section">
                      <h4 
                        className="publishing-options-title" 
                        data-block-key="service.publishing-options.title"
                      >
                        {publishingOptionsTitle}
                      </h4>
                      <p 
                        className="publishing-options-desc" 
                        data-block-key="service.publishing-options.desc"
                      >
                        {publishingOptionsDesc}
                      </p>

                      <div className="publishing-packages-container">
                        {publishingPackagesList.map((pkg) => (
                          <div 
                            key={pkg.slug} 
                            className="publishing-package-card"
                            onClick={() => {
                              const found = allServicesList.find(s => s.slug === pkg.slug);
                              if (found) setSelectedService(found);
                            }}
                          >
                            <div className="publishing-package-card-header">
                              <h5 className="publishing-package-card-title m-0">
                                {pkg.title}
                              </h5>
                              <span className="publishing-package-arrow-badge">
                                <i className="bi bi-arrow-right-short"></i>
                              </span>
                            </div>
                            <p 
                              className="publishing-package-card-summary" 
                              data-block-key={`service.${pkg.slug}.summary`}
                            >
                              {pkg.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : selectedService?.slug === 'evaluation-services' ? (
                    /* Evaluation Services Overview Content (Image 1) */
                    <div className="evaluation-services-overview-content">
                      {/* Section 1: Editorial Rx Referral */}
                      <div className="evaluation-section-block mb-4">
                        <h4 
                          className="editorial-accent-title fw-bold mb-2" 
                          style={{ color: '#d9534f', fontSize: '1.25rem' }}
                          data-block-key="service.evaluation-services.rx_title"
                        >
                          {t('service.evaluation-services.rx_title', 'Editorial Rx Referral')}
                        </h4>
                        <p 
                          className="editorial-section-p mb-3" 
                          style={{ color: '#57534e', fontSize: '0.98rem', lineHeight: '1.7' }}
                          data-block-key="service.evaluation-services.rx_desc"
                        >
                          {t('service.evaluation-services.rx_desc', 'Through this service, an evaluator will recommend the services of an appropriate editorial specialist—from a copyeditor or content editor to a developmental editor or book doctor.')}
                        </p>
                        
                        {/* Quote Block */}
                        <blockquote 
                          className="editorial-testimonial-quote"
                          style={{
                            margin: '18px 0',
                            padding: '16px 20px',
                            borderLeft: '4px solid #d9534f',
                            background: 'rgba(217, 83, 79, 0.04)',
                            borderRadius: '0 8px 8px 0',
                            fontStyle: 'italic',
                            color: '#444'
                          }}
                        >
                          <p className="mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.6' }} data-block-key="service.evaluation-services.rx_quote">
                            {t('service.evaluation-services.rx_quote', '"With the various points to examine and adjust in mind, I re-read This Golden Land and made changes along the way. These were excellent points, by the way, and very helpful to me for cleaning up the manuscript."')}
                          </p>
                          <footer 
                            className="editorial-quote-author" 
                            style={{ fontStyle: 'normal', fontWeight: '600', color: '#666', fontSize: '0.88rem' }}
                            data-block-key="service.evaluation-services.rx_author"
                          >
                            {t('service.evaluation-services.rx_author', '-Barbara Wood, author of This Golden Land')}
                          </footer>
                        </blockquote>
                      </div>

                      {/* Section 2: Editorial Evaluation Services */}
                      <div className="evaluation-section-block mb-4">
                        <h4 
                          className="editorial-accent-title fw-bold mb-2" 
                          style={{ color: '#d9534f', fontSize: '1.25rem' }}
                          data-block-key="service.evaluation-services.eval_title"
                        >
                          {t('service.evaluation-services.eval_title', 'Editorial Evaluation Services')}
                        </h4>
                        <p 
                          className="editorial-section-p mb-0" 
                          style={{ color: '#57534e', fontSize: '0.98rem', lineHeight: '1.7' }}
                          data-block-key="service.evaluation-services.eval_desc"
                        >
                          {t('service.evaluation-services.eval_desc', "Regardless of your publishing goals, the editorial quality of your work matters—no one wants to read a book that's riddled with typos and grammatical errors. However, even the best writers make occasional mistakes. Omni provides editorial services that will help you make your book the best it can be.")}
                        </p>
                      </div>

                      {/* Direct Interactive Card to Explore Editorial Evaluation */}
                      <div className="publishing-packages-container mt-4">
                        <div 
                          className="publishing-package-card"
                          onClick={() => {
                            const ee = allServicesList.find(s => s.slug === 'editorial-evaluation');
                            if (ee) setSelectedService(ee);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="publishing-package-card-header">
                            <h5 className="publishing-package-card-title m-0">
                              Editorial Evaluation
                            </h5>
                            <span className="publishing-package-arrow-badge">
                              <i className="bi bi-arrow-right-short"></i>
                            </span>
                          </div>
                          <p className="publishing-package-card-summary">
                            Explore our complete manuscript diagnostic checkup, detailed observations report, and $299 credit toward professional editorial services.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : selectedService?.slug === 'editorial-evaluation' ? (
                    /* Editorial Evaluation Detail Content (Image 2) */
                    <div className="editorial-evaluation-detail-content">
                      {/* Narrative Paragraphs */}
                      <div className="editorial-evaluation-narrative mb-4" style={{ color: '#44403c', fontSize: '0.98rem', lineHeight: '1.75' }}>
                        <p className="mb-3" data-block-key="service.editorial-evaluation.p1">
                          {t('service.editorial-evaluation.p1', "The Editorial Evaluation is a manuscript checkup that assesses your work to be sure that it has fulfilled the basic requirements of a published book. The editorial evaluator will not only provide you with a general overview of your manuscript but will also educate you through constructive comments on how to write a better book.")}
                        </p>
                        <p className="mb-3" data-block-key="service.editorial-evaluation.p2">
                          {t('service.editorial-evaluation.p2', "The Editorial Evaluation is a detailed report on the observations of an evaluator about the strengths and weaknesses of your manuscript (rather than an editing of your manuscript). At the end of the evaluation, an Editorial Rx Referral will recommend the services of an appropriate editorial specialist—from a copyeditor or content editor to a developmental editor. You may then choose to purchase those services from Omni. If you do choose to purchase an editorial service, our staff will assign your book to a specialist who will address the issues raised in the Editorial Evaluation and give your manuscript the professional attention that it would receive at a traditional publishing house. You may also choose to use your own freelance editor or make the recommended changes yourself.")}
                        </p>

                        {/* Quote Block */}
                        <blockquote 
                          className="editorial-testimonial-quote"
                          style={{
                            margin: '22px 0',
                            padding: '16px 22px',
                            borderLeft: '4px solid #ad7d42',
                            background: 'rgba(173, 125, 66, 0.05)',
                            borderRadius: '0 8px 8px 0',
                            fontStyle: 'italic',
                            color: '#333'
                          }}
                        >
                          <p className="mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.6' }} data-block-key="service.editorial-evaluation.quote">
                            {t('service.editorial-evaluation.quote', '"I appreciate all the editorial work that went into the analysis – I was very impressed with the job Omni did with my book. The analysis was thorough, clear, and very helpful. Thank you again for all your assistance on making his Golden LandT even better!"')}
                          </p>
                          <footer 
                            className="editorial-quote-author" 
                            style={{ fontStyle: 'normal', fontWeight: '600', color: '#78716c', fontSize: '0.88rem' }}
                            data-block-key="service.editorial-evaluation.quote_author"
                          >
                            {t('service.editorial-evaluation.quote_author', '—Barbara Wood, author of This Golden Land')}
                          </footer>
                        </blockquote>

                        <p className="mb-3" data-block-key="service.editorial-evaluation.p3">
                          {t('service.editorial-evaluation.p3', "The Editorial Evaluation also qualifies you for possible selection to our prestigious Editor's Choice program.")}
                        </p>
                        <p className="mb-3" data-block-key="service.editorial-evaluation.p4">
                          {t('service.editorial-evaluation.p4', "Here are a few examples of questions that are answered in Editorial Evaluations depending on your book's genre.")}
                        </p>
                        <p className="mb-3" data-block-key="service.editorial-evaluation.p5">
                          {t('service.editorial-evaluation.p5', "Please note: The Editorial Evaluation is not a replacement for Omni's editorial services. Rather, it is a preliminary diagnostic tool, examining several sections of the manuscript in detail, to pinpoint areas in need of improvement. Evaluators offer examples of items that could be strengthened and give critique and commentary across a range of topics.")}
                        </p>
                        <p className="mb-4" data-block-key="service.editorial-evaluation.p6">
                          {t('service.editorial-evaluation.p6', "The Editorial Evaluation fee is based on industry standard manuscript word count of 100,000 words or less. For manuscripts above 100,000 words, the author may choose to have approximately the first 100,000 words assessed during the Editorial Evaluation. If the author wishes to have the full manuscript evaluated, an additional fee for each 50,000 words over 100,000 will be required. Should the author purchase one of our editing services, the full manuscript will be edited line by line.")}
                        </p>
                      </div>

                      {/* Note & Credit Box */}
                      <div 
                        className="editorial-note-callout p-3 mb-4 rounded-3"
                        style={{
                          background: '#faf6f0',
                          border: '1px solid rgba(173, 125, 66, 0.3)',
                          borderLeft: '5px solid #ad7d42'
                        }}
                      >
                        <div className="fw-bold mb-1" style={{ color: '#2b2219', fontSize: '0.95rem' }}>Note:</div>
                        <p className="fst-italic mb-2" style={{ color: '#57534e', fontSize: '0.92rem', lineHeight: '1.6' }} data-block-key="service.editorial-evaluation.credit_note">
                          {t('service.editorial-evaluation.credit_note', 'You have the option to work with your editor or make changes yourself. However, should you decide to purchase any of our Editorial Services, you will receive a $299 credit which will be deducted from the overall editing cost.')}
                        </p>
                        <div className="fw-bold" style={{ color: '#ad7d42', fontSize: '0.92rem' }} data-block-key="service.editorial-evaluation.duration">
                          {t('service.editorial-evaluation.duration', 'Duration: 2-3 Weeks')}
                        </div>
                      </div>

                      {/* Feature bullets */}
                      <div className="features-checklist-section">
                        <h5 className="fw-bold mb-3" style={{ color: '#2b2219', fontSize: '1.1rem' }} data-block-key="services.included.heading">
                          {includedHeading}
                        </h5>
                        <div className="service-features-list">
                          {displayFeatures.map((feat, idx) => (
                            <div className="feature-checkpoint-item" key={idx}>
                              <i className="bi bi-patch-check-fill feature-check-icon"></i>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : selectedService?.slug === 'developmental-editing' ? (
                    /* Developmental Editing (Matching Screenshot 1 - NO PRICE) */
                    <div className="developmental-editing-detail-content">
                      <div className="editorial-callout-notice p-3 mb-4 rounded-3" style={{ background: '#faf6f0', borderLeft: '4px solid #ad7d42' }}>
                        <p className="fst-italic mb-1 fw-medium" style={{ color: '#57534e', fontSize: '0.92rem' }}>
                          Prescribed by Editorial Evaluation only. Please speak with your editorial consultant for more information.
                        </p>
                        <p className="fst-italic mb-0 fw-semibold" style={{ color: '#ad7d42', fontSize: '0.92rem' }}>
                          Please Note: A Developmental Edit includes FREE Content Editing and Quality Review.
                        </p>
                      </div>

                      <div className="editorial-narrative mb-4" style={{ color: '#44403c', fontSize: '0.98rem', lineHeight: '1.75' }}>
                        <p className="mb-3">
                          The Omni Developmental Editing service combines three editorial services into one package: First, a developmental editor evaluates the manuscript at the paragraph, chapter, and book levels and makes suggestions throughout the manuscript to identify big-picture areas that need work.
                        </p>

                        <div className="p-3 mb-3 rounded-3" style={{ background: '#fcfbf9', border: '1px solid #ebd9c4' }}>
                          <ul className="mb-0 ps-3 d-flex flex-column gap-2" style={{ color: '#44403c', fontSize: '0.94rem' }}>
                            <li>
                              <strong>For fiction works</strong>, the editor will analyze the readership and genre to determine whether the content is appropriate. He will then examine essential considerations such as plot, pace, characterization and dialogue.
                            </li>
                            <li>
                              <strong>For nonfiction titles</strong>, the editor will analyze the readership, purpose, and possible uses of the work to determine that the content is complete and appropriate; that concepts are developed adequately; that material is well organized; and that illustrations, tables, and lists are used effectively throughout.
                            </li>
                          </ul>
                        </div>

                        <p className="mb-3">
                          Authors can choose to make improvements suggested by the developmental editor themselves or purchase the services of a Book Doctor to help them make alterations. (If applicable, a price estimate for book doctoring is included with the completed developmental edit.) Once big-picture changes have been made, the second step, a free Content Edit, begins; the content editor will check the manuscript for errors in grammar, spelling, and punctuation. And third, the manuscript will receive a quality review to ensure the manuscript is editorially sound before it goes into production.
                        </p>

                        <blockquote 
                          className="editorial-testimonial-quote"
                          style={{
                            margin: '22px 0',
                            padding: '16px 22px',
                            borderLeft: '4px solid #ad7d42',
                            background: 'rgba(173, 125, 66, 0.05)',
                            borderRadius: '0 8px 8px 0',
                            fontStyle: 'italic',
                            color: '#333'
                          }}
                        >
                          <p className="mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                            "I am THRILLED with the edit so far! I've never had a developmental edit, and it's so cool to 'hear' someone else's voice regarding the material. What's more, the editor has targeted areas that I subconsciously knew needed work, but just didn't hear my conscious voice telling me how to correct. Please let her know how excited I am and how far her input had surpassed what I thought I was paying for."
                          </p>
                          <footer style={{ fontStyle: 'normal', fontWeight: '600', color: '#78716c', fontSize: '0.88rem' }}>
                            — Eric Rankin, author of <em>The Aquarians</em>
                          </footer>
                        </blockquote>
                      </div>

                      {/* Feature bullets */}
                      <div className="features-checklist-section">
                        <h5 className="fw-bold mb-3" style={{ color: '#2b2219', fontSize: '1.1rem' }} data-block-key="services.included.heading">
                          {includedHeading}
                        </h5>
                        <div className="service-features-list">
                          {displayFeatures.map((feat, idx) => (
                            <div className="feature-checkpoint-item" key={idx}>
                              <i className="bi bi-patch-check-fill feature-check-icon"></i>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : selectedService?.slug === 'book-doctor' ? (
                    /* Book Doctor (Matching Screenshot 2 - NO PRICE) */
                    <div className="book-doctor-detail-content">
                      <div className="editorial-callout-notice p-3 mb-4 rounded-3" style={{ background: '#faf6f0', borderLeft: '4px solid #ad7d42' }}>
                        <p className="fst-italic mb-0 fw-medium" style={{ color: '#57534e', fontSize: '0.92rem' }}>
                          Prerequisite: Omni Developmental Edit. Please speak with your editorial consultant for more information.
                        </p>
                      </div>

                      <div className="editorial-narrative mb-4" style={{ color: '#44403c', fontSize: '0.98rem', lineHeight: '1.75' }}>
                        <p className="mb-3">
                          Following the advice of a professional editor takes time and careful consideration. Developmental Editing, in particular, often requires the author to rewrite or reorganize the manuscript to enhance material. Hiring a book doctor may be the best choice for authors who don't have the time or ability to make the big-picture changes recommended by a developmental editor.
                        </p>
                        <p className="mb-3">
                          A book doctor makes the changes recommended by the developmental editor and approved by the author. A price quote for the book doctor will be provided with the completed developmental edit.
                        </p>
                        <p className="mb-3 fw-medium" style={{ color: '#2b2219' }}>
                          After completion of Book Doctoring, Content Editing and a Quality Review will be provided at no extra cost.
                        </p>

                        <div className="p-3 mb-3 rounded-3" style={{ background: '#fdfaf5', border: '1px solid #ebd9c4' }}>
                          <span className="fw-bold" style={{ color: '#ad7d42' }}>Duration: </span>
                          <span style={{ color: '#57534e' }}>Estimate based on work required and detailed through the Developmental Edit.</span>
                        </div>
                      </div>

                      {/* Feature bullets */}
                      <div className="features-checklist-section">
                        <h5 className="fw-bold mb-3" style={{ color: '#2b2219', fontSize: '1.1rem' }} data-block-key="services.included.heading">
                          {includedHeading}
                        </h5>
                        <div className="service-features-list">
                          {displayFeatures.map((feat, idx) => (
                            <div className="feature-checkpoint-item" key={idx}>
                              <i className="bi bi-patch-check-fill feature-check-icon"></i>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (selectedService?.slug?.startsWith('quality-review-') || selectedService?.slug?.startsWith('editorial-assistant-')) ? (
                    /* Quality Review & Editorial Assistant Series (Matching Screenshots 3, 4, 5 - NO PRICE) */
                    <div className="quality-review-detail-content">
                      <div className="editorial-callout-notice p-3 mb-4 rounded-3" style={{ background: '#faf6f0', borderLeft: '4px solid #ad7d42' }}>
                        <p className="fst-italic mb-0 fw-medium" style={{ color: '#57534e', fontSize: '0.92rem' }}>
                          Prerequisite: Omni {selectedService.title.replace('Quality Review - ', '').replace('Editorial Assistant - ', '')}. Please speak with your editorial consultant for more information.
                        </p>
                      </div>

                      <div className="editorial-narrative mb-4" style={{ color: '#44403c', fontSize: '0.98rem', lineHeight: '1.75' }}>
                        <p className="mb-3">
                          Our {selectedService.title} service provides a final check to make sure your revised manuscript is sound before it goes into production—for a fraction of the price of your original edit.
                        </p>
                        <p className="mb-3">
                          After you review and revise your edited manuscript, you may want an editor to check your work to ensure that you've done it correctly and haven't created new errors in the process.
                        </p>

                        {selectedService.slug === 'quality-review-copyediting' && (
                          <blockquote 
                            className="editorial-testimonial-quote"
                            style={{
                              margin: '22px 0',
                              padding: '16px 22px',
                              borderLeft: '4px solid #ad7d42',
                              background: 'rgba(173, 125, 66, 0.05)',
                              borderRadius: '0 8px 8px 0',
                              fontStyle: 'italic',
                              color: '#333'
                            }}
                          >
                            <p className="mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                              "I am really impressed by [the editor's] incredible attention to detail, and I am just so grateful there are people like her who can subject my writing to such close critical analysis."
                            </p>
                            <footer style={{ fontStyle: 'normal', fontWeight: '600', color: '#78716c', fontSize: '0.88rem' }}>
                              — Michelle Dixon, author of <em>The Disappearance of Lilya Bekirova</em>
                            </footer>
                          </blockquote>
                        )}

                        <p className="mb-3">
                          With the Quality Review, an editor will not only review the work you've done on the manuscript in response to the editing, but ensure that you've adequately addressed all of the queries and comments.
                        </p>

                        <p className="fst-italic mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                          *There is a 5,000-word minimum charge for all editing services.
                        </p>
                      </div>

                      {/* Feature bullets */}
                      <div className="features-checklist-section">
                        <h5 className="fw-bold mb-3" style={{ color: '#2b2219', fontSize: '1.1rem' }} data-block-key="services.included.heading">
                          {includedHeading}
                        </h5>
                        <div className="service-features-list">
                          {displayFeatures.map((feat, idx) => (
                            <div className="feature-checkpoint-item" key={idx}>
                              <i className="bi bi-patch-check-fill feature-check-icon"></i>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : isCurrentSubcategoryOverview ? (
                    /* Subcategory Overview matching user's screenshots (Image 1 - Image 5) */
                    <div className="subcategory-overview-content">
                      <div className="subcategory-services-lead-container mb-4">
                        <div 
                          className="d-flex align-items-center justify-content-between mb-3 pb-2" 
                          style={{ borderBottom: '2px solid rgba(173, 125, 66, 0.2)' }}
                        >
                          <h4 className="fw-bold m-0" style={{ color: '#2b2219', fontSize: '1.2rem' }}>
                            Available Services in {selectedService.title}
                          </h4>
                          <span className="badge rounded-pill bg-light text-muted border px-2.5 py-1" style={{ fontSize: '0.78rem' }}>
                            {(selectedService.services || currentSubcategory?.services || []).filter(s => s.slug !== selectedCategory?.id && s.slug !== selectedService.slug).length} Offerings
                          </span>
                        </div>
                        <p className="text-muted mb-4" style={{ fontSize: '0.92rem' }}>
                          Select any service below to explore complete inclusions, pricing, and dedicated publishing assistance.
                        </p>

                        {/* List of services in this subcategory */}
                        <div className="d-flex flex-column gap-3 mb-4">
                          {(selectedService.services || currentSubcategory?.services || [])
                            .filter(s => s.slug !== selectedCategory?.id && s.slug !== selectedService.slug)
                            .map((svc) => {
                              const svcTitle = t(`service.${svc.slug}.title`, svc.title);
                              const svcLead = AUTHENTIC_SERVICE_SUMMARIES[svc.slug] || t(`service.${svc.slug}.lead`, svc.lead || svc.lead_paragraph || svc.summary || '');
                              const svcPrice = t(`service.${svc.slug}.price`, svc.price || svc.price_display || '');

                              return (
                                <div
                                  key={svc.slug}
                                  className="subcategory-service-card"
                                  onClick={() => handleSelectService({ ...svc, title: svcTitle }, selectedCategory, currentSubcategory)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                                    <h5
                                      className="subcategory-item-title fw-bold m-0"
                                      style={{ color: '#d9534f', fontSize: '1.18rem', letterSpacing: '-0.01em', transition: 'color 0.2s ease' }}
                                      data-block-key={`service.${svc.slug}.title`}
                                    >
                                      {svcTitle}
                                    </h5>
                                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                      <span className="publishing-package-arrow-badge">
                                        <i className="bi bi-arrow-right-short"></i>
                                      </span>
                                    </div>
                                  </div>

                                  {svcLead && (
                                    <p
                                      className="mb-0"
                                      style={{ color: '#57534e', fontSize: '0.94rem', lineHeight: '1.68' }}
                                      data-block-key={`service.${svc.slug}.lead`}
                                    >
                                      {svcLead}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* What's Included Feature Checklist for Subcategory */}
                      <div className="features-checklist-section">
                        <h5 className="fw-bold mb-3" style={{ color: '#2b2219', fontSize: '1.1rem' }} data-block-key="services.included.heading">
                          {includedHeading}
                        </h5>
                        <div className="service-features-list">
                          {displayFeatures.map((feat, idx) => (
                            <div className="feature-checkpoint-item" key={idx}>
                              <i className="bi bi-patch-check-fill feature-check-icon"></i>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : isCurrentCategoryOverview ? (
                    /* General Category Overview with Subcategory Options & Key Benefits */
                    <div className="category-overview-content">
                      {/* Specific Callouts / Quotes for Categories */}
                      {selectedService?.slug === 'editorial-services' && (
                        <div 
                          className="editorial-note-callout p-3 mb-4 rounded-3"
                          style={{
                            background: '#faf6f0',
                            border: '1px solid rgba(173, 125, 66, 0.3)',
                            borderLeft: '5px solid #ad7d42'
                          }}
                        >
                          <div className="fw-bold mb-1" style={{ color: '#2b2219', fontSize: '0.98rem' }}>
                            Chicago Manual of Style & Microsoft Word Tracking
                          </div>
                          <p className="mb-0" style={{ color: '#57534e', fontSize: '0.92rem', lineHeight: '1.68' }}>
                            In order to take advantage of our Editorial Services, you must have access to Microsoft Word. Our editing appears as tracked changes in your manuscript, which must be read in Word. Omni evaluators, editors, and copywriters follow the most current edition of the Chicago Manual of Style, the premier style guide used by traditional book publishers.
                          </p>
                        </div>
                      )}

                      {selectedService?.slug === 'formats' && (
                        <div 
                          className="editorial-note-callout p-3 mb-4 rounded-3"
                          style={{
                            background: '#faf6f0',
                            border: '1px solid rgba(173, 125, 66, 0.3)',
                            borderLeft: '5px solid #ad7d42'
                          }}
                        >
                          <div className="fw-bold mb-1" style={{ color: '#2b2219', fontSize: '0.98rem' }}>
                            Industry-Standard Print & Digital Formats
                          </div>
                          <p className="mb-0" style={{ color: '#57534e', fontSize: '0.92rem', lineHeight: '1.68' }}>
                            All manuscripts submitted to Omni are formatted as trade paperbacks and printed on high-quality, acid-free, book-grade opaque paper stock. Standard with our publishing packages, with options for hardcover cloth bindings and professional audiobook production.
                          </p>
                        </div>
                      )}

                      {selectedService?.slug === 'design-services' && (
                        <div 
                          className="editorial-note-callout p-3 mb-4 rounded-3"
                          style={{
                            background: '#faf6f0',
                            border: '1px solid rgba(173, 125, 66, 0.3)',
                            borderLeft: '5px solid #ad7d42'
                          }}
                        >
                          <div className="fw-bold mb-1" style={{ color: '#2b2219', fontSize: '0.98rem' }}>
                            First Impressions That Sell
                          </div>
                          <p className="mb-0" style={{ color: '#57534e', fontSize: '0.92rem', lineHeight: '1.68' }}>
                            The cover is the first opportunity you have to connect with potential readers. That's why at Omni we make sure that your cover and interior layout meet the professional standards for commercially successful books.
                          </p>
                        </div>
                      )}

                      {selectedService?.slug === 'production' && (
                        <div 
                          className="editorial-note-callout p-3 mb-4 rounded-3"
                          style={{
                            background: '#faf6f0',
                            border: '1px solid rgba(173, 125, 66, 0.3)',
                            borderLeft: '5px solid #ad7d42'
                          }}
                        >
                          <div className="fw-bold mb-1" style={{ color: '#2b2219', fontSize: '0.98rem' }}>
                            Seamless Publishing Workflow
                          </div>
                          <p className="mb-0" style={{ color: '#57534e', fontSize: '0.92rem', lineHeight: '1.68' }}>
                            Preparing your manuscript for submission and publishing is a whole lot easier when we do it for you. Omni handles everything from raw document conversion to post-layout revisions and catalog resubmissions.
                          </p>
                        </div>
                      )}

                      {selectedService?.slug === 'marketing-services' && (
                        <blockquote 
                          className="editorial-testimonial-quote"
                          style={{
                            margin: '18px 0 24px',
                            padding: '16px 20px',
                            borderLeft: '4px solid #ad7d42',
                            background: 'rgba(173, 125, 66, 0.05)',
                            borderRadius: '0 8px 8px 0',
                            fontStyle: 'italic',
                            color: '#444'
                          }}
                        >
                          <p className="mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.6' }} data-block-key="service.marketing-services.quote">
                            {t('service.marketing-services.quote', '"Once my book was released, I had to think about marketing and publicity. I received tremendous guidance from my marketing consultant and publicist! They made my life easy and worry-free. Thank you Omni for helping independent authors publish and market their books with confidence!"')}
                          </p>
                          <footer 
                            className="editorial-quote-author" 
                            style={{ fontStyle: 'normal', fontWeight: '600', color: '#666', fontSize: '0.88rem' }}
                            data-block-key="service.marketing-services.quote_author"
                          >
                            {t('service.marketing-services.quote_author', '—Carisia Switala, author of Eternity\'s Secret')}
                          </footer>
                        </blockquote>
                      )}

                      {selectedService?.slug === 'bookselling' && (
                        <div 
                          className="editorial-note-callout p-3 mb-4 rounded-3"
                          style={{
                            background: '#faf6f0',
                            border: '1px solid rgba(173, 125, 66, 0.3)',
                            borderLeft: '5px solid #ad7d42'
                          }}
                        >
                          <div className="fw-bold mb-1" style={{ color: '#2b2219', fontSize: '0.98rem' }}>
                            Worldwide Retail Distribution & Legal Protection
                          </div>
                          <p className="mb-0" style={{ color: '#57534e', fontSize: '0.92rem', lineHeight: '1.68' }}>
                            Once your book is published, we make it available for order online with retail outlets worldwide. Our bookselling promotional services provide you the opportunity to actively promote and protect your book.
                          </p>
                        </div>
                      )}

                      {/* Subcategories Options Grid */}
                      {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                        <div className="publishing-options-section mb-4">
                          <h4 className="publishing-options-title">
                            Explore {selectedCategory.title} Options
                          </h4>
                          <p className="publishing-options-desc">
                            Select any section below to view individual specialist services, packages, and detailed offerings.
                          </p>

                          <div className="publishing-packages-container">
                            {selectedCategory.subcategories.map((sub) => {
                              const subServiceCount = (sub.services || []).filter(s => s.slug !== selectedCategory.id).length;
                              const subSummary = SUBCATEGORY_DESCRIPTIONS[sub.id] || `${sub.title} services designed for published authors.`;
                              return (
                                <div 
                                  key={sub.id}
                                  className="publishing-package-card"
                                  onClick={() => handleJumpToSubcategory(selectedCategory, sub)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="publishing-package-card-header">
                                    <h5 className="publishing-package-card-title m-0">
                                      {sub.title}
                                    </h5>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.72rem' }}>
                                        {subServiceCount} {subServiceCount === 1 ? 'Service' : 'Services'}
                                      </span>
                                      <span className="publishing-package-arrow-badge">
                                        <i className="bi bi-arrow-right-short"></i>
                                      </span>
                                    </div>
                                  </div>
                                  <p className="publishing-package-card-summary">
                                    {subSummary}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* What's Included / Key Category Highlights */}
                      <div className="features-checklist-section">
                        <h5 className="fw-bold mb-3" style={{ color: '#2b2219', fontSize: '1.1rem' }} data-block-key="services.included.heading">
                          {includedHeading}
                        </h5>
                        <div className="service-features-list">
                          {displayFeatures.map((feat, idx) => (
                            <div className="feature-checkpoint-item" key={idx}>
                              <i className="bi bi-patch-check-fill feature-check-icon"></i>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* What's Included Feature Checklist for Individual Services */
                    <div className="features-checklist-section">
                      <h5 className="fw-bold mb-3" style={{ color: '#2b2219', fontSize: '1.1rem' }} data-block-key="services.included.heading">
                        {includedHeading}
                      </h5>

                      <div className="service-features-list">
                        {displayFeatures.map((feat, idx) => (
                          <div className="feature-checkpoint-item" key={idx}>
                            <i className="bi bi-patch-check-fill feature-check-icon"></i>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Action Card (Book / Consult) */}
                  <div className="service-cta-card">
                    <div className="service-cta-text-col">
                      <h4 className="fw-bold mb-1" style={{ color: '#ffffff', fontSize: '1.25rem' }} data-block-key="services.cta.heading">
                        {ctaHeading}
                      </h4>
                      <p className="small mb-0" style={{ color: '#fae2b2' }} data-block-key="services.cta.subtitle">
                        {ctaSubtitle}
                      </p>
                    </div>

                    <div className="service-cta-actions">
                      <Link to="/#contact" className="service-cta-btn">
                        <span data-block-key="services.cta.btn_text">{ctaBtnText}</span>
                        <i className="bi bi-arrow-right"></i>
                      </Link>

                      <div className="service-email-action-row">
                        <span className="service-email-label">or email us on</span>
                        <button
                          type="button"
                          className={`service-email-chip ${emailCopied ? 'copied' : ''}`}
                          onClick={handleCopyEmail}
                          title={emailCopied ? "Copied to clipboard!" : "Click to copy email address"}
                          aria-label={`Copy email: ${ctaEmail}`}
                        >
                          <i className={`bi ${emailCopied ? 'bi-check-circle-fill' : 'bi-envelope-fill'} email-lead-icon`}></i>
                          <span className="service-email-address" data-block-key="services.cta.email">
                            {ctaEmail}
                          </span>
                          <span className="email-copy-icon-btn" aria-hidden="true">
                            <i className={`bi ${emailCopied ? 'bi-check2' : 'bi-clipboard'}`}></i>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Next / Previous Controls */}
                  <div className="service-nav-controls">
                    <button
                      type="button"
                      className="service-step-btn"
                      disabled={!prevService}
                      onClick={() => prevService && handleSelectService(prevService)}
                    >
                      <i className="bi bi-arrow-left"></i>
                      <span className="d-none d-sm-inline">Previous: </span>
                      <span className="text-truncate" style={{ maxWidth: '140px' }}>
                        {prevService ? t(`service.${prevService.slug}.title`, prevService.title) : 'None'}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="service-step-btn"
                      disabled={!nextService}
                      onClick={() => nextService && handleSelectService(nextService)}
                    >
                      <span className="d-none d-sm-inline">Next: </span>
                      <span className="text-truncate" style={{ maxWidth: '140px' }}>
                        {nextService ? t(`service.${nextService.slug}.title`, nextService.title) : 'None'}
                      </span>
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>

                </div>
              ) : (
                <div className="text-center p-5 bg-white rounded-3 shadow-sm">
                  <i className="bi bi-search fs-1 text-muted"></i>
                  <h4 className="mt-3">No matching services found</h4>
                  <p className="text-muted">Try clearing your search query or selecting another category.</p>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategoryTag('all');
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modern Slide-Over Off-Canvas Drawer for Mobile */}
        <div
          className={`mobile-drawer-overlay ${drawerOpen ? 'open' : ''}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
          <div className="drawer-header">
            <h3 className="drawer-title">
              <i className="bi bi-grid-fill" style={{ color: '#d8aa71' }}></i>
              Service Categories
            </h3>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close categories menu"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="drawer-body">
            {catalog.map((cat) => {
              const isExpanded = expandedCategories[cat.id] || expandedCategories[cat.tag] || searchQuery.length > 0;
              const catTitle = t(`service.${cat.id}.title`, cat.title);
              const isCatOverviewSelected = selectedService?.slug === cat.id;
              return (
                <div key={cat.id} className="sidebar-category-group mb-2">
                  <button
                    type="button"
                    className={`category-accordion-btn ${isExpanded ? 'expanded' : ''} ${isCatOverviewSelected ? 'active-category' : ''}`}
                    onClick={() => {
                      toggleCategoryAccordion(cat.tag);
                      const catOverviewSvc = allServicesList.find((s) => s.slug === cat.id);
                      if (catOverviewSvc) {
                        handleSelectService(
                          {
                            ...catOverviewSvc,
                            title: catOverviewSvc.title || t(`service.${catOverviewSvc.slug}.title`, cat.title),
                            lead: catOverviewSvc.lead || catOverviewSvc.lead_paragraph || t(`service.${catOverviewSvc.slug}.lead`, ''),
                          },
                          cat,
                          cat.subcategories[0]
                        );
                        setDrawerOpen(false);
                      } else if (cat.subcategories[0]?.services[0]) {
                        const targetSvc = cat.subcategories[0].services[0];
                        handleSelectService({ ...targetSvc, title: targetSvc.title || t(`service.${targetSvc.slug}.title`, '') }, cat, cat.subcategories[0]);
                        setDrawerOpen(false);
                      }
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <i className={`bi ${cat.icon}`} style={{ color: '#ad7d42' }}></i>
                      <span data-block-key={`service.${cat.id}.title`}>{catTitle}</span>
                    </span>
                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} small`}></i>
                  </button>

                  {isExpanded && (
                    <div className="subcategories-list">
                      {cat.subcategories.map((sub) => {
                        const subTitle = t(`service.${sub.id}.title`, sub.title);
                        const filteredServices = (sub.services || []).filter(
                          (svc) => svc.slug !== cat.id
                        );
                        if (filteredServices.length === 0) return null;

                        const defaultSubOpen =
                          selectedService?.subcategoryId === sub.id ||
                          filteredServices.some((s) => s.slug === selectedService?.slug) ||
                          cat.subcategories.length === 1 ||
                          searchQuery.length > 0;

                        const isSubExpanded =
                          expandedSubcategories[sub.id] !== undefined
                            ? expandedSubcategories[sub.id]
                            : defaultSubOpen;

                        const isSubOverviewSelected = selectedService?.slug === sub.id;

                        return (
                          <div key={sub.id} className="subcategory-group mb-2">
                            <button
                              type="button"
                              className={`subcategory-dropdown-btn ${isSubExpanded ? 'expanded' : ''} ${isSubOverviewSelected ? 'active-subcategory' : ''}`}
                              onClick={() => {
                                handleSelectSubcategory(cat, sub);
                                setDrawerOpen(false);
                              }}
                              aria-expanded={isSubExpanded}
                            >
                              <span className="subcategory-label-text" data-block-key={`service.${sub.id}.title`}>
                                {subTitle}
                              </span>
                              <span className="d-flex align-items-center gap-1">
                                <span className="subcat-count-badge">
                                  {filteredServices.length}
                                </span>
                                <span
                                  className="subcat-toggle-chevron-btn"
                                  title={isSubExpanded ? "Collapse" : "Expand"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSubcategoryAccordion(sub.id, e, defaultSubOpen);
                                  }}
                                >
                                  <i className={`bi bi-chevron-${isSubExpanded ? 'down' : 'right'} subcat-chevron`}></i>
                                </span>
                              </span>
                            </button>

                            {isSubExpanded && (
                              <div className="subcategory-services-list">
                                {filteredServices.map((svc) => {
                                  const isSelected = selectedService?.slug === svc.slug;
                                  const svcTitle = t(`service.${svc.slug}.title`, svc.title);
                                  return (
                                    <button
                                      key={svc.slug}
                                      type="button"
                                      className={`service-nav-item ${isSelected ? 'active' : ''}`}
                                      onClick={() => {
                                        handleSelectService({ ...svc, title: svcTitle }, cat, sub);
                                        setDrawerOpen(false);
                                      }}
                                    >
                                      <span className="text-truncate" data-block-key={`service.${svc.slug}.title`}>{svcTitle}</span>
                                      {isSelected && <i className="bi bi-check2"></i>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
