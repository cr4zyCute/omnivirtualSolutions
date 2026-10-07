const fs = require('fs');
const path = require('path');

// 1. Update frontend/src/data/services-content.json
const jsonPath = path.resolve(__dirname, '../frontend/src/data/services-content.json');
const contentData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const newBodyHtml = `<div class="bookblast-video-marketing-stand-alone-detail-content">
  <div class="editorial-narrative mb-4" style="color: #44403c; font-size: 0.98rem; line-height: 1.75;">
    <p class="mb-4">
      Go the extra mile with your marketing campaign, and place your video as an ad on YouTube. Seize the opportunity to have your book video introduced as an advertising break before, or in between, YouTube videos. Your book information, purchase and availability details are displayed when the ad is clicked.
    </p>

    <h5 class="fw-bold mb-3" style="color: #2b2219; font-size: 1.05rem;">
      What you get:
    </h5>

    <ul class="mb-4 ps-3" style="color: #44403c; font-size: 0.95rem; line-height: 1.75;">
      <li>
        A 30-day* ad placement campaign on YouTube that gives viewers a preview of your book. Your ad will appear at the beginning of a YouTube video, or in between videos. Viewers can get more information about your book by clicking on the video, which redirects them to either your book's online bookstore page or your own book website.
      </li>
    </ul>

    <p class="mb-3">
      Please note that you may sign up for this package only if you have purchased any of the following Omni book video services:
    </p>

    <ul class="mb-4 ps-3" style="color: #44403c; font-size: 0.95rem; line-height: 1.75;">
      <li>
        <a href="/services?service=standard-book-video" class="service-inline-link fw-semibold" style="color: #ad7d42;">Standard Book Video</a>
      </li>
      <li>
        <a href="/services?service=premium-book-video" class="service-inline-link fw-semibold" style="color: #ad7d42;">Premium Book Video</a>
      </li>
    </ul>

    <p class="mb-4 fst-italic" style="color: #57534e; font-size: 0.92rem;">
      *Want to have a longer campaign period? Contact your marketing consultant to get a custom quote for your video campaign.
    </p>

    <div class="more-about-section mb-4">
      <h6 class="fw-bold mb-1" style="color: #2b2219; font-size: 0.98rem;">
        More About | Bookblast Video Marketing - Standalone (30 Days)
      </h6>
      <p class="mb-0" style="color: #57534e; font-size: 0.95rem; line-height: 1.7;">
        Catch the curiosity and interest of YouTube viewers to increase your reach – and potential book sales.
      </p>
    </div>

    <p class="disclaimer-text fst-italic text-muted mt-5 pt-3" style="font-size: 0.84rem; line-height: 1.6; border-top: 1px solid rgba(0, 0, 0, 0.08);">
      Disclaimer: Prices listed do not include applicable taxes (such as sales, use, excise, value-added, goods and services, or other tax), which will be added to the total at the time of purchase. Prices listed do include the copies of the book; the cost of shipping and handling will be calculated and charged after your book is made available for sale.
    </p>
  </div>
</div>`;

contentData['bookblast-video-marketing-stand-alone-30days'] = {
  file: "bookblast-Video-Marketing-Stand-alone.html",
  price: "",
  bodyHtml: newBodyHtml
};

fs.writeFileSync(jsonPath, JSON.stringify(contentData, null, 2), 'utf8');
console.log('Updated services-content.json successfully!');

// 2. Update admin/services-content-registry.js
const registryPath = path.resolve(__dirname, '../admin/services-content-registry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

const newRegistryHtml = `<div class=\"bookblast-video-marketing-stand-alone-detail-content\">\n                      <div class=\"editorial-narrative mb-4\" style=\"color: #44403c; font-size: 0.98rem; line-height: 1.75;\">\n                        <p class=\"mb-4 editable-field\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.p1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                          Go the extra mile with your marketing campaign, and place your video as an ad on YouTube. Seize the opportunity to have your book video introduced as an advertising break before, or in between, YouTube videos. Your book information, purchase and availability details are displayed when the ad is clicked.\n                        </p>\n\n                        <h5 class=\"fw-bold mb-3 editable-field\" style=\"color: #2b2219; font-size: 1.05rem;\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.h1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                          What you get:\n                        </h5>\n\n                        <ul class=\"mb-4 ps-3\" style=\"color: #44403c; font-size: 0.95rem; line-height: 1.75;\">\n                          <li class=\"editable-field\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.li1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                            A 30-day* ad placement campaign on YouTube that gives viewers a preview of your book. Your ad will appear at the beginning of a YouTube video, or in between videos. Viewers can get more information about your book by clicking on the video, which redirects them to either your book's online bookstore page or your own book website.\n                          </li>\n                        </ul>\n\n                        <p class=\"mb-3 editable-field\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.p2\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                          Please note that you may sign up for this package only if you have purchased any of the following Omni book video services:\n                        </p>\n\n                        <ul class=\"mb-4 ps-3\" style=\"color: #44403c; font-size: 0.95rem; line-height: 1.75;\">\n                          <li>\n                            <a href=\"/services?service=standard-book-video\" class=\"service-inline-link fw-semibold\" style=\"color: #ad7d42;\">Standard Book Video</a>\n                          </li>\n                          <li>\n                            <a href=\"/services?service=premium-book-video\" class=\"service-inline-link fw-semibold\" style=\"color: #ad7d42;\">Premium Book Video</a>\n                          </li>\n                        </ul>\n\n                        <p class=\"mb-4 fst-italic editable-field\" style=\"color: #57534e; font-size: 0.92rem;\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.p3\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                          *Want to have a longer campaign period? Contact your marketing consultant to get a custom quote for your video campaign.\n                        </p>\n\n                        <div class=\"more-about-section mb-4\">\n                          <h6 class=\"fw-bold mb-1 editable-field\" style=\"color: #2b2219; font-size: 0.98rem;\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.more_title\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                            More About | Bookblast Video Marketing - Standalone (30 Days)\n                          </h6>\n                          <p class=\"mb-0 editable-field\" style=\"color: #57534e; font-size: 0.95rem; line-height: 1.7;\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.more_desc\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                            Catch the curiosity and interest of YouTube viewers to increase your reach – and potential book sales.\n                          </p>\n                        </div>\n\n                        <p class=\"disclaimer-text fst-italic text-muted mt-5 pt-3 editable-field\" style=\"font-size: 0.84rem; line-height: 1.6; border-top: 1px solid rgba(0, 0, 0, 0.08);\" data-block-key=\"service.bookblast-video-marketing-stand-alone-30days.disclaimer\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-stand-alone-30days', this)\">\n                          Disclaimer: Prices listed do not include applicable taxes (such as sales, use, excise, value-added, goods and services, or other tax), which will be added to the total at the time of purchase. Prices listed do include the copies of the book; the cost of shipping and handling will be calculated and charged after your book is made available for sale.\n                        </p>\n                      </div>\n                    </div>`;

const targetKey = '  "bookblast-video-marketing-stand-alone-30days": ';
const startIdx = registryContent.indexOf(targetKey);
if (startIdx !== -1) {
  const lineEndIdx = registryContent.indexOf(',\n', startIdx);
  const endIdx = lineEndIdx !== -1 ? lineEndIdx : registryContent.indexOf(',\r\n', startIdx);
  if (endIdx !== -1) {
    registryContent = registryContent.substring(0, startIdx + targetKey.length) + JSON.stringify(newRegistryHtml) + registryContent.substring(endIdx);
    fs.writeFileSync(registryPath, registryContent, 'utf8');
    console.log('Updated services-content-registry.js successfully!');
  } else {
    console.error('Could not find line ending in registry');
  }
} else {
  console.error('Could not find target key in registry');
}
