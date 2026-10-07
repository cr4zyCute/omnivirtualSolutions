const fs = require('fs');
const path = require('path');

// 1. Update frontend/src/data/services-content.json
const jsonPath = path.resolve(__dirname, '../frontend/src/data/services-content.json');
const contentData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const newBodyHtml = `<div class="bookblast-video-marketing-standard-detail-content">
  <div class="editorial-narrative mb-4" style="color: #44403c; font-size: 0.98rem; line-height: 1.75;">
    <p class="mb-4">
      The appeal of a book video is undeniable – and the numbers show it. YouTube has over a billion video viewers, and every day, people watch hundreds of millions of hours on YouTube. Make sure your book catches the attention of an engaged and influential audience of online video viewers with the creation of your book video and your YouTube advertising campaign.
    </p>

    <h5 class="fw-bold mb-3" style="color: #2b2219; font-size: 1.05rem;">
      What you get:
    </h5>

    <ul class="mb-4 ps-3" style="color: #44403c; font-size: 0.95rem; line-height: 1.75;">
      <li>
        One <a href="/services?service=standard-book-video" class="service-inline-link fw-semibold" style="color: #ad7d42;">Standard Book Video</a> marketing service
      </li>
      <li>
        A 30-second version of the Standard Book Video to be used in the YouTube campaign.
      </li>
      <li>
        A 30-day ad placement campaign on YouTube that gives viewers a preview of your book. Your ad will appear at the beginning of a YouTube video, or in between videos. Viewers can get more information about your book by clicking on the video, which redirects them to either your book’s online bookstore page or your own book website.
      </li>
    </ul>
  </div>
</div>`;

contentData['bookblast-video-marketing-standard'] = {
  file: "bookblast-Video-Marketing-Standard.html",
  price: "",
  bodyHtml: newBodyHtml
};

fs.writeFileSync(jsonPath, JSON.stringify(contentData, null, 2), 'utf8');
console.log('Updated services-content.json for bookblast-video-marketing-standard successfully!');

// 2. Update admin/services-content-registry.js
const registryPath = path.resolve(__dirname, '../admin/services-content-registry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

const newRegistryHtml = `<div class=\"bookblast-video-marketing-standard-detail-content\">\n                      <div class=\"editorial-narrative mb-4\" style=\"color: #44403c; font-size: 0.98rem; line-height: 1.75;\">\n                        <p class=\"mb-4 editable-field\" data-block-key=\"service.bookblast-video-marketing-standard.p1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-standard', this)\">\n                          The appeal of a book video is undeniable – and the numbers show it. YouTube has over a billion video viewers, and every day, people watch hundreds of millions of hours on YouTube. Make sure your book catches the attention of an engaged and influential audience of online video viewers with the creation of your book video and your YouTube advertising campaign.\n                        </p>\n\n                        <h5 class=\"fw-bold mb-3 editable-field\" style=\"color: #2b2219; font-size: 1.05rem;\" data-block-key=\"service.bookblast-video-marketing-standard.h1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-standard', this)\">\n                          What you get:\n                        </h5>\n\n                        <ul class=\"mb-4 ps-3\" style=\"color: #44403c; font-size: 0.95rem; line-height: 1.75;\">\n                          <li class=\"editable-field\" data-block-key=\"service.bookblast-video-marketing-standard.li1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-standard', this)\">\n                            One <a href=\"/services?service=standard-book-video\" class=\"service-inline-link fw-semibold\" style=\"color: #ad7d42;\">Standard Book Video</a> marketing service\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.bookblast-video-marketing-standard.li2\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-standard', this)\">\n                            A 30-second version of the Standard Book Video to be used in the YouTube campaign.\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.bookblast-video-marketing-standard.li3\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('bookblast-video-marketing-standard', this)\">\n                            A 30-day ad placement campaign on YouTube that gives viewers a preview of your book. Your ad will appear at the beginning of a YouTube video, or in between videos. Viewers can get more information about your book by clicking on the video, which redirects them to either your book’s online bookstore page or your own book website.\n                          </li>\n                        </ul>\n                      </div>\n                    </div>`;

const targetKey = '  "bookblast-video-marketing-standard": ';
const startIdx = registryContent.indexOf(targetKey);
if (startIdx !== -1) {
  const lineEndIdx = registryContent.indexOf(',\n', startIdx);
  const endIdx = lineEndIdx !== -1 ? lineEndIdx : registryContent.indexOf(',\r\n', startIdx);
  if (endIdx !== -1) {
    registryContent = registryContent.substring(0, startIdx + targetKey.length) + JSON.stringify(newRegistryHtml) + registryContent.substring(endIdx);
    fs.writeFileSync(registryPath, registryContent, 'utf8');
    console.log('Updated services-content-registry.js for bookblast-video-marketing-standard successfully!');
  } else {
    console.error('Could not find line ending in registry');
  }
} else {
  console.error('Could not find target key in registry');
}
