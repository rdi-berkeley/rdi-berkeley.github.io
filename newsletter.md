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

<style>
    .campaign {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    font-weight: 500;
    color: black;
    font-size: 16px;
    margin-bottom: 15px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
    display: block !important;
}

</style>

<!-- Main Content Area -->
<div style="font-size: 16px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', 'Liberation Sans', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; font-weight: 400; width: 60%; margin-left: 20%; margin-top: 10px; padding: 20px;">
    <h2>Newsletter Archive</h2>

    <!-- Preload Mailchimp Script -->
    <link rel="preload" href="https://berkeley.us14.list-manage.com/generate-js/?u=0d89bb5c8066a9533eb98759d&show=100&fid=68734" as="script">

    <!-- Mailchimp Script (Loaded First) -->
    <script language="javascript" src="https://berkeley.us14.list-manage.com/generate-js/?u=0d89bb5c8066a9533eb98759d&show=100&fid=68734" type="text/javascript"></script>

    <!-- Apply Styles Instantly After Loading -->
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            let checkContent = setInterval(() => {
                let newsletters = document.querySelectorAll('.campaign');
                let loadingMessage = document.getElementById('loading-message');

                if (newsletters.length > 0) {
                    clearInterval(checkContent); // Stop checking once content is loaded
                    loadingMessage.style.display = 'none'; // Hide loading text

                    // Apply styles immediately
                    newsletters.forEach(el => {
                        el.style.fontFamily = "'Lato', sans-serif";
                        el.style.fontWeight = '500';  // Slightly bold
                        el.style.color = 'black';  
                        el.style.fontSize = '16px'; 
                        el.style.marginBottom = '15px'; 
                        el.style.borderBottom = '1px solid #ddd'; 
                        el.style.paddingBottom = '10px';
                    });
                }
            }, 100); // Check every 100ms
        });
    </script>
</div>
