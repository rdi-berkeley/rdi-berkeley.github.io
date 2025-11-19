---
layout: events
---

{% assign events = site.data.events | where: "category", "main" %}

<div>
    {% for row in events %}
    <a href="{{ row.link }}" aria-label="Event"><img alt="Event Banner" src="{{ row.img }}" style="width: 100%; margin-top: 0.5rem; margin-bottom: 0.5rem;"></a>
        <!-- <a class="event-a" href="{{ row.link }}"><h2  style="font-weight: 700;">{{ row.row-title }}</h2></a>
        <h3  style="font-weight: 700;">{{ row.formatted-date }} {{ row.start }} - {{ row.end }} PT</h3>
        <p style="margin-bottom: 2em;">{{ row.description }}</p> -->
    {% endfor %}
</div>

<!-- Use an embeded form and use JavaScript to create the pop-up effect on click -->
  <div id="modal" hidden></div>
  <div id="subscribe" hidden>
    <!-- Begin Mailchimp Signup Form -->
    <link href="//cdn-images.mailchimp.com/embedcode/classic-10_7.css" rel="stylesheet" type="text/css">
    <style type="text/css">
      #mc_embed_signup {
        background: #fff;
        clear: left;
        font: 16px Helvetica, Arial, sans-serif;
        width: 600px;
        padding: 0px 10px 0px 10px;
      }
      /* Add your own Mailchimp form style overrides in your site stylesheet or in this style block.
        We recommend moving this block and the preceding CSS link to the HEAD of your HTML file. */
    </style>
    <div id="mc_embed_signup">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" id="formclose">
        <span aria-hidden="true" style="font-size: 25px;">&times;</span>
      </button>
      <form action="https://berkeley.us14.list-manage.com/subscribe/post?u=0d89bb5c8066a9533eb98759d&amp;id=c0a5c3e877"
        method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank"
        novalidate>
        <div id="mc_embed_signup_scroll">
          <img src="../assets/images/rdi_logo_vertical_720.png" alt="Berkeley RDI"
            style="width: 550px; height: auto; margin-top: -10px; margin-bottom: 10px;">
          <h2>Subscribe to Our Mailing List</h2>
          <div class="indicates-required" style="margin-top: -15px;"><span class="asterisk">*</span> indicates required</div>
          <div class="mc-field-group">
            <label for="mce-EMAIL">Email Address <span class="asterisk">*</span>
            </label>
            <input type="email" value="" name="EMAIL" class="required email" id="mce-EMAIL">
          </div>
          <div class="mc-field-group">
            <label for="mce-FNAME">First Name <span class="asterisk">*</span>
            </label>
            <input type="text" value="" name="FNAME" class="required" id="mce-FNAME">
          </div>
          <div class="mc-field-group">
            <label for="mce-LNAME">Last Name <span class="asterisk">*</span>
            </label>
            <input type="text" value="" name="LNAME" class="required" id="mce-LNAME">
          </div>
          <div class="mc-field-group">
            <label for="mce-ORG">Organization </label>
            <input type="text" value="" name="ORG" class="" id="mce-ORG">
          </div>
          <div class="mc-field-group">
            <label for="mce-CATEGORY">Category </label>
            <select name="CATEGORY" class="" id="mce-CATEGORY">
              <option value=""></option>
              <option value="Academic">Academic</option>
              <option value="Industry">Industry</option>
              <option value="Other (e.g. NGO, Government)">Other (e.g. NGO, Government)</option>
            </select>
          </div>
          <div id="mce-responses" class="clear">
            <div class="response" id="mce-error-response" style="display:none"></div>
            <div class="response" id="mce-success-response" style="display:none"></div>
          </div>
          <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
          <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text"
              name="b_0d89bb5c8066a9533eb98759d_c0a5c3e877" tabindex="-1" value=""></div>
          <div class="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe"
              class="button"></div>
        </div>
      </form>
    </div>
    <script type='text/javascript' src='//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js'></script>
    <script
      type='text/javascript'>(function ($) { window.fnames = new Array(); window.ftypes = new Array(); fnames[0] = 'EMAIL'; ftypes[0] = 'email'; fnames[1] = 'FNAME'; ftypes[1] = 'text'; fnames[2] = 'LNAME'; ftypes[2] = 'text'; fnames[3] = 'ADDRESS'; ftypes[3] = 'address'; fnames[4] = 'PHONE'; ftypes[4] = 'phone'; fnames[5] = 'BIRTHDAY'; ftypes[5] = 'birthday'; fnames[6] = 'ORG'; ftypes[6] = 'text'; fnames[7] = 'CATEGORY'; ftypes[7] = 'dropdown'; }(jQuery)); var $mcj = jQuery.noConflict(true);</script>
    <!--End mc_embed_signup-->

  </div>

    

 <section class="py-8 px-6 text-center">
  <a href="/otherevents" class="bg-yellow-400 text-blue-900 px-8 py-3 font-bold rounded border-2 border-yellow-400 hover:bg-yellow-500 inline-block transition-colors duration-200">
    Click Here for Other Past Events
  </a>
</section>
