---
layout: default
---

<!-- Top Navigation Links -->
<div style="color: black; width: 100%; height: auto; margin-top: 20px; display: flex; justify-content: start; gap: 20px;">
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
<div style="font-size: 14px; font-family: 'Lato', sans-serif; font-weight: 400; width: 90%; margin: 40px auto; padding: 20px; max-width: 1000px;">
    <h2>Newsletter Archive</h2>
    
    <!-- Newsletter Archive Container -->
    <div class="display_archive" style="height: auto; max-height: 600px; overflow-y: scroll; padding: 10px; border: 1px solid #ccc;">
        <p>Loading newsletters...</p>
    </div>

    <!-- Mailchimp Script to Load Newsletters -->
    <script language="javascript" src="https://berkeley.us14.list-manage.com/generate-js/?u=0d89bb5c8066a9533eb98759d&show=100&fid=68734" type="text/javascript"></script>

    <!-- Apply Dynamic Styles to Loaded Newsletters -->
    <script>
        window.onload = function() {
            setTimeout(() => {
                document.querySelectorAll('.campaign').forEach(el => {
                    el.style.fontFamily = "'Lato', sans-serif";
                    el.style.fontWeight = '500';  // Slightly bold
                    el.style.color = 'black';  
                    el.style.fontSize = '14px'; 
                    el.style.marginBottom = '15px'; 
                    el.style.borderBottom = '1px solid #ddd'; 
                    el.style.paddingBottom = '10px';
                });
            }, 1500); // Delay to ensure script populates newsletters
        };
    </script>
</div>
