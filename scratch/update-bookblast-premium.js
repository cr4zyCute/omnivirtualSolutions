const fs = require('fs');
const path = require('path');

// 1. Update frontend/src/data/services-content.json
const jsonPath = path.resolve(__dirname, '../frontend/src/data/services-content.json');
const contentData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const newBodyHtml = `<div class="bookblast-video-marketing-premium-detail-content">
  <div class="editorial-narrative mb-4" style="color: #44403c; font-size: 0.98rem; line-height: 1.75;">
    <p class="mb-4">
      Strengthen your book’s presence in the marketplace, and boost its selling potential, by showcasing it on YouTube. With this advertising package, you now have the means to widen your reach and attract more readers. YouTube has over a billion video viewers, and every day, people watch hundreds of millions of hours on YouTube. Capture their curiosity by inviting a professional voice actor to narrate your book video, and hold their attention with a strategic YouTube video advertising campaign that targets viewers with keen interest in your book’s genre and style.
    </p>

    <h5 class="fw-bold mb-3" style="color: #2b2219; font-size: 1.05rem;">
      What you get:
    </h5>

    <ul class="mb-4 ps-3" style="color: #44403c; font-size: 0.95rem; line-height: 1.75;">
      <li>
        One <a href="/services?service=premium-book-video" class="service-inline-link fw-semibold" style="color: #ad7d42;">Premium Book Video</a> marketing service
      </li>
      <li>
        A 30-second version of the Premium Book Video to be used in the YouTube campaign.
      </li>
      <li>
        A 30-day ad placement campaign on YouTube that gives viewers a preview of your book. Your ad will appear at the beginning of a YouTube video, or in between videos. Viewers can get more information about your book by clicking on the video, which redirects them to either your book’s online bookstore page or your own book website.
      </li>
    </ul>
  </div>
</div>`;

contentData['bookblast-video-marketing-premium'] = {
  file: "bookblast-Video-Marketing-Premium.html",
  price: "",
  bodyHtml: newBodyHtml
};

fs.writeFileSync(jsonPath, JSON.stringify(contentData, null, 2), 'utf8');
console.log('Updated services-content.json for bookblast-video-marketing-premium successfully!');

// 2. Update admin/services-content-registry.js
const registryPath = path.resolve(__dirname, '../admin/services-content-registry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

const newRegistryHtml = `<div class=\"bookblast-video-marketing-premium-detail-content\">\n                      <div class=\"editorial-narrative mb-4\" style=\"color: #44403c; font-size: 0.98rem; line-height: 1.75;\">\n                        <p class=\"mb-4 editable-field\" data-block-key=\"service.bookblast-video-marketing-premium.p1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-premium', this)\">\n                          Strengthen your book’s presence in the marketplace, and boost its selling potential, by showcasing it on YouTube. With this advertising package, you now have the means to widen your reach and attract more readers. YouTube has over a billion video viewers, and every day, people watch hundreds of millions of hours on YouTube. Capture their curiosity by inviting a professional voice actor to narrate your book video, and hold their attention with a strategic YouTube video advertising campaign that targets viewers with keen interest in your book’s genre and style.\n                        </p>\n\n                        <h5 class=\"fw-bold mb-3 editable-field\" style=\"color: #2b2219; font-size: 1.05rem;\" data-block-key=\"service.bookblast-video-marketing-premium.h1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-premium', this)\">\n                          What you get:\n                        </h5>\n\n                        <ul class=\"mb-4 ps-3\" style=\"color: #44403c; font-size: 0.95rem; line-height: 1.75;\">\n                          <li class=\"editable-field\" data-block-key=\"service.bookblast-video-marketing-premium.li1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-premium', this)\">\n                            One <a href=\"/services?service=premium-book-video\" class=\"service-inline-link fw-semibold\" style=\"color: #ad7d42;\">Premium Book Video</a> marketing service\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.bookblast-video-marketing-premium.li2\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-premium', this)\">\n                            A 30-second version of the Premium Book Video to be used in the YouTube campaign.\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.bookblast-video-marketing-premium.li3\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-premium', this)\">\n                            A 30-day ad placement campaign on YouTube that gives viewers a preview of your book. Your ad will appear at the beginning of a YouTube video, or in between videos. Viewers can get more information about your book by clicking on the video, which redirects them to either your book’s online bookstore page or your own book website.\n                          </li>\n                        </ul>\n                      </div>\n                    </div>`;

const targetKey = '  "bookblast-video-marketing-premium": ';
const startIdx = registryContent.indexOf(targetKey);
if (startIdx !== -1) {
  const lineEndIdx = registryContent.indexOf(',\n', startIdx);
  const endIdx = lineEndIdx !== -1 ? lineEndIdx : registryContent.indexOf(',\r\n', startIdx);
  if (endIdx !== -1) {
    registryContent = registryContent.substring(0, startIdx + targetKey.length) + JSON.stringify(newRegistryHtml) + registryContent.substring(endIdx);
    fs.writeFileSync(registryPath, registryContent, 'utf8');
    console.log('Updated services-content-registry.js for bookblast-video-marketing-premium successfully!');
  } else {
    console.error('Could not find line ending in registry');
  }
} else {
  console.error('Could not find target key in registry');
}

// 3. Update frontend/src/data/catalog.json lead
const catalogPath = path.resolve(__dirname, '../frontend/src/data/catalog.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
for (const cat of catalogData) {
  for (const sub of (cat.subcategories || [])) {
    for (const svc of (sub.services || [])) {
      if (svc.slug === 'bookblast-video-marketing-premium') {
        svc.lead = "Strengthen your book’s presence in the marketplace, and boost its selling potential, by showcasing it on YouTube. With this advertising package, you now have the means to widen your reach and attract more readers. YouTube has over a billion video viewers, and every day, people watch hundreds of millions of hours on YouTube. Capture their curiosity by inviting a professional voice actor to narrate your book video, and hold their attention with a strategic YouTube video advertising campaign that targets viewers with keen interest in your book’s genre and style.";
      }
    }
  }
}
fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2), 'utf8');
console.log('Updated catalog.json lead for bookblast-video-marketing-premium successfully!');
