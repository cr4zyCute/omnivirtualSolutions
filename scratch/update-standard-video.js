const fs = require('fs');
const path = require('path');

// 1. Update frontend/src/data/services-content.json
const jsonPath = path.resolve(__dirname, '../frontend/src/data/services-content.json');
const contentData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const newBodyHtml = `<div class="standard-book-video-detail-content">
  <div class="editorial-narrative mb-4" style="color: #44403c; font-size: 0.98rem; line-height: 1.75;">
    <p class="mb-3">
      A Standard Book Video can help you create and maintain a meaningful presence online in the competitive marketplace. Video book videos are an excellent addition to your press releases, social media sites, and personal websites to help your book stand out in the crowd.
    </p>

    <p class="mb-3">
      By posting your video on social media sites and personal websites you can reach a valuable audience of online video viewers and attract potential readers. Video marketing helps you engage your audience on a level they can’t ignore.
    </p>

    <p class="mb-4">
      Take a look at Ernst Aebi's Standard Book Video showcasing his book Seasons of Sand Sahara.
    </p>

    <h5 class="fw-bold mb-3" style="color: #2b2219; font-size: 1.05rem;">
      Our Standard Book Video includes the following features:
    </h5>

    <ul class="mb-4 ps-3" style="color: #44403c; font-size: 0.95rem; line-height: 1.75;">
      <li>
        Creation of a custom-made video book video, approximately 45 to 60 seconds in length
      </li>
      <li>
        Storytelling through text and 2-D graphics and image
      </li>
      <li>
        Distribution of your video to YouTube in order to maximize exposure
      </li>
      <li>
        Web streaming capability
      </li>
      <li>
        Review of your video for TV and film consideration by 5 More Minutes
      </li>
    </ul>

    <p class="mb-4">
      You will own all the rights to your book video and will be provided with the final video file to share with readers, friends, and family and include in your marketing materials.
    </p>

    <p class="mb-2">
      <strong>Revisions:</strong> You will be able to make one round of revisions to your video at no additional cost. Any additional rounds of revisions will cost an additional fee. Acceptable changes include:
    </p>

    <ul class="mb-4 ps-3" style="color: #44403c; font-size: 0.95rem; line-height: 1.75;">
      <li>Simple text changes</li>
      <li>Changes in font size</li>
      <li>Corrections or additions to book and author information</li>
      <li>Changes to audio levels</li>
      <li>Image changes (if you provided your own or you feel an image is offensive)</li>
    </ul>

    <p class="mb-2">
      Once your video is completed, it will be considered for TV or movie adaption by 5 More Minutes.
    </p>

    <ul class="mb-4 ps-3" style="color: #44403c; font-size: 0.95rem; line-height: 1.75;">
      <li>
        If 5 More Minutes is interested in working with you, they will directly contact you to explain their plan of action to gauge your interest.
      </li>
      <li>
        If after reviewing your video 5 More Minutes decides not to engage with your concept, it will then be entered into our Hollywood Database, where registered entertainment professionals can browse and search for new material to adapt into feature films and television series.
      </li>
    </ul>

    <div class="about-5mm-card p-4 rounded-3 mt-4" style="background: #fdfaf5; border: 1px solid #ebd9c4;">
      <div class="row align-items-center g-4">
        <div class="col-12 col-md-4 text-center">
          <img src="/assets/img/5mm.png" alt="5 More Minutes Logo" class="img-fluid" style="max-width: 280px; width: 100%; height: auto;" />
        </div>
        <div class="col-12 col-md-8">
          <h4 class="fw-bold mb-3" style="color: #2b2219; font-size: 1.25rem;">
            About 5 More Minutes
          </h4>
          <p class="mb-0" style="color: #57534e; font-size: 0.93rem; line-height: 1.72;">
            5 More Minutes is a full-service production shingle run by veteran Hollywood executive John Sacchi. Sacchi has spent over two decades in the entertainment industry. Before founding 5 More Minutes, Sacchi spent 15 years as a senior production and development executive at Lionsgate Films where he oversaw films including Confidence, Employee of the Month, They Came Together, My Bloody Valentine, The Possession, Killers, The Last Stand, Addicted, Conan the Barbarian, Punisher, My Best Friend’s Girl, Pride, and Akeelah and the Bee. Some of the current projects 5 More Minutes is developing include an English language remake of <em>Instructions not Included</em>, directed by Anne Fletcher for Lionsgate; <em>Vanish Man</em> directed by Lee Toland Krieger and co-produced for 21 Laps and Lionsgate; <em>Dork Diaries</em>, which is based on the New York Times best selling children's book series and produced for Lionsgate; and the New York Times best selling author's <em>Rogues Gallery</em>, which is being produced for Lionsgate Television.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>`;

contentData['standard-book-video'] = {
  file: "standard-Book-Video.html",
  price: "",
  bodyHtml: newBodyHtml
};

fs.writeFileSync(jsonPath, JSON.stringify(contentData, null, 2), 'utf8');
console.log('Updated services-content.json for standard-book-video successfully!');

// 2. Update admin/services-content-registry.js
const registryPath = path.resolve(__dirname, '../admin/services-content-registry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

const newRegistryHtml = `<div class=\"standard-book-video-detail-content\">\n                      <div class=\"editorial-narrative mb-4\" style=\"color: #44403c; font-size: 0.98rem; line-height: 1.75;\">\n                        <p class=\"mb-3 editable-field\" data-block-key=\"service.standard-book-video.p1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                          A Standard Book Video can help you create and maintain a meaningful presence online in the competitive marketplace. Video book videos are an excellent addition to your press releases, social media sites, and personal websites to help your book stand out in the crowd.\n                        </p>\n\n                        <p class=\"mb-3 editable-field\" data-block-key=\"service.standard-book-video.p2\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                          By posting your video on social media sites and personal websites you can reach a valuable audience of online video viewers and attract potential readers. Video marketing helps you engage your audience on a level they can’t ignore.\n                        </p>\n\n                        <p class=\"mb-4 editable-field\" data-block-key=\"service.standard-book-video.p3\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                          Take a look at Ernst Aebi's Standard Book Video showcasing his book Seasons of Sand Sahara.\n                        </p>\n\n                        <h5 class=\"fw-bold mb-3 editable-field\" style=\"color: #2b2219; font-size: 1.05rem;\" data-block-key=\"service.standard-book-video.h1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                          Our Standard Book Video includes the following features:\n                        </h5>\n\n                        <ul class=\"mb-4 ps-3\" style=\"color: #44403c; font-size: 0.95rem; line-height: 1.75;\">\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.li1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                            Creation of a custom-made video book video, approximately 45 to 60 seconds in length\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.li2\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                            Storytelling through text and 2-D graphics and image\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.li3\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                            Distribution of your video to YouTube in order to maximize exposure\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.li4\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                            Web streaming capability\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.li5\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                            Review of your video for TV and film consideration by 5 More Minutes\n                          </li>\n                        </ul>\n\n                        <p class=\"mb-4 editable-field\" data-block-key=\"service.standard-book-video.p4\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                          You will own all the rights to your book video and will be provided with the final video file to share with readers, friends, and family and include in your marketing materials.\n                        </p>\n\n                        <p class=\"mb-2 editable-field\" data-block-key=\"service.standard-book-video.p5\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                          <strong>Revisions:</strong> You will be able to make one round of revisions to your video at no additional cost. Any additional rounds of revisions will cost an additional fee. Acceptable changes include:\n                        </p>\n\n                        <ul class=\"mb-4 ps-3\" style=\"color: #44403c; font-size: 0.95rem; line-height: 1.75;\">\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.rev1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">Simple text changes</li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.rev2\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">Changes in font size</li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.rev3\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">Corrections or additions to book and author information</li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.rev4\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">Changes to audio levels</li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.rev5\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">Image changes (if you provided your own or you feel an image is offensive)</li>\n                        </ul>\n\n                        <p class=\"mb-2 editable-field\" data-block-key=\"service.standard-book-video.p6\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                          Once your video is completed, it will be considered for TV or movie adaption by 5 More Minutes.\n                        </p>\n\n                        <ul class=\"mb-4 ps-3\" style=\"color: #44403c; font-size: 0.95rem; line-height: 1.75;\">\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.hly1\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                            If 5 More Minutes is interested in working with you, they will directly contact you to explain their plan of action to gauge your interest.\n                          </li>\n                          <li class=\"editable-field\" data-block-key=\"service.standard-book-video.hly2\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                            If after reviewing your video 5 More Minutes decides not to engage with your concept, it will then be entered into our Hollywood Database, where registered entertainment professionals can browse and search for new material to adapt into feature films and television series.\n                          </li>\n                        </ul>\n\n                        <div class=\"about-5mm-card p-4 rounded-3 mt-4\" style=\"background: #fdfaf5; border: 1px solid #ebd9c4;\">\n                          <div class=\"row align-items-center g-4\">\n                            <div class=\"col-12 col-md-4 text-center\">\n                              <img src=\"/assets/img/5mm.png\" alt=\"5 More Minutes Logo\" class=\"img-fluid\" style=\"max-width: 280px; width: 100%; height: auto;\" />\n                            </div>\n                            <div class=\"col-12 col-md-8\">\n                              <h4 class=\"fw-bold mb-3 editable-field\" style=\"color: #2b2219; font-size: 1.25rem;\" data-block-key=\"service.standard-book-video.about_title\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                                About 5 More Minutes\n                              </h4>\n                              <p class=\"mb-0 editable-field\" style=\"color: #57534e; font-size: 0.93rem; line-height: 1.72;\" data-block-key=\"service.standard-book-video.about_desc\" contenteditable=\"true\" spellcheck=\"false\" onblur=\"handleContentBlockSave('standard-book-video', this)\">\n                                5 More Minutes is a full-service production shingle run by veteran Hollywood executive John Sacchi. Sacchi has spent over two decades in the entertainment industry. Before founding 5 More Minutes, Sacchi spent 15 years as a senior production and development executive at Lionsgate Films where he oversaw films including Confidence, Employee of the Month, They Came Together, My Bloody Valentine, The Possession, Killers, The Last Stand, Addicted, Conan the Barbarian, Punisher, My Best Friend’s Girl, Pride, and Akeelah and the Bee. Some of the current projects 5 More Minutes is developing include an English language remake of <em>Instructions not Included</em>, directed by Anne Fletcher for Lionsgate; <em>Vanish Man</em> directed by Lee Toland Krieger and co-produced for 21 Laps and Lionsgate; <em>Dork Diaries</em>, which is based on the New York Times best selling children's book series and produced for Lionsgate; and the New York Times best selling author's <em>Rogues Gallery</em>, which is being produced for Lionsgate Television.\n                              </p>\n                            </div>\n                          </div>\n                        </div>\n                      </div>\n                    </div>`;

const targetKey = '  "standard-book-video": ';
const startIdx = registryContent.indexOf(targetKey);
if (startIdx !== -1) {
  const lineEndIdx = registryContent.indexOf(',\n', startIdx);
  const endIdx = lineEndIdx !== -1 ? lineEndIdx : registryContent.indexOf(',\r\n', startIdx);
  if (endIdx !== -1) {
    registryContent = registryContent.substring(0, startIdx + targetKey.length) + JSON.stringify(newRegistryHtml) + registryContent.substring(endIdx);
    fs.writeFileSync(registryPath, registryContent, 'utf8');
    console.log('Updated services-content-registry.js for standard-book-video successfully!');
  } else {
    console.error('Could not find line ending in registry');
  }
} else {
  console.error('Could not find target key in registry');
}
