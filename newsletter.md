---
layout: default
---

<!-- Sidebar Navigation -->
<div style="color: black; width: 15%; height: auto; margin-top: 60px; position: absolute; display: flex; flex-direction: column; gap: 15px;">
    <a href="/publicCourses" class="nav-url">
        Public Courses
    </a>
    <a href="/firesides" class="nav-url">
        Firesides & Panels
    </a>
    <a href="/newsletter" class="nav-url" style="text-decoration: underline;">
        Newsletter
    </a>
    <a href="https://twitter.com/BerkeleyRDI?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @BerkeleyRDI</a>
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</div>

<!-- Main Content Area -->
<div style="font-size: 14px; font-family: 'Lato', sans-serif; font-weight: 400; width: 75%; margin-left: 20%; padding: 20px;">
    <h2>Newsletter Archive</h2>
    
    <!-- Newsletter Archive Container -->
    <div id="newsletter-container" class="display_archive" style="height: auto; max-height: 600px; overflow-y: scroll; padding: 10px; border: 1px solid #ccc;">
    </div>

    <!-- Mailchimp Script to Load Newsletters -->
    <script language="javascript" src="https://berkeley.us14.list-manage.com/generate-js/?u=0d89bb5c8066a9533eb98759d&show=100&fid=68734" type="text/javascript"></script>

    <!-- Apply Dynamic Styles and Remove "Loading" Text -->
    <script>
        window.onload = function() {
            setTimeout(() => {
                let newsletterContainer = document.getElementById('newsletter-container');

                // Style each newsletter campaign
                document.querySelectorAll('.campaign').forEach(el => {
                    el.style.fontFamily = "'Lato', sans-serif";
                    el.style.fontWeight = '500';  // Slightly bold
                    el.style.color = 'black';  
                    el.style.fontSize = '18px'; 
                    el.style.marginBottom = '15px'; 
                    el.style.borderBottom = '1px solid #ddd'; 
                    el.style.paddingBottom = '10px';
                });
            }, 500); // Delay to ensure script populates newsletters
        };
    </script>
</div>
