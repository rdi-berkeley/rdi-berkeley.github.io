# Berkeley RDI Website

## Editing the website

Note that it takes up to a few minutes for the update to be reflected on the deployed webpages. Please disable the caching of the browser to see the latest version in the first time.

Also **please do not delete the CNAME in the root directory**, which would cause an error for GitHub page custom domain name.

### Editing the landing page

1. **Update the content**: Change [this markdown file](https://github.com/rdi-berkeley/rdi-berkeley.github.io/blob/main/index.md).

### How to add/update faculty information

1. **Upload their photo**: Go to [this folder](https://github.com/rdi-berkeley/rdi-berkeley.github.io/tree/main/assets/images/people), click "Add file" button, select "Upload files" option, and add the photo file (preferably in the shape of square in `jpg` format).

2. **Update the entry**: Go to [this file](https://github.com/rdi-berkeley/rdi-berkeley.github.io/blob/main/_data/people.yml), click the small pencil button (that has a hint text "Edit this file", or use [this link](https://github.com/rdi-berkeley/rdi-berkeley.github.io/edit/main/_data/people.yml)). You can see how sections are arranged in the file.
    - If you want to create a new entry, just use the same template as below (please be careful with the indentation). Note that for the field of `image_file` you need to enter exactly the same name that you just uploaded to `/assets/images/people` folder.
    ```
        - name: Dawn Song
            homepage: https://people.eecs.berkeley.edu/~dawnsong/
            image_file: dawn.jpg
            subtitle: "Security & Privacy, Blockchain, ML" 
    ```

### How to add/update events

1. **Upload the banner**: Go to the `/assets/images/events` folder and add the banner file. The file should be in the format `M-d.png` (ex. 4-7.png for the April 7 event).

2. **Update the data entry**: Go to `/_data/events/events.yml` and add a new entry at the top of the file. Below is the format of the entry as well as an example:

   > Format
   
   ```
   - link: /events/M-d
     row-title: "TITLE"
     date: "yyyy-MM-dd"
     formatted-date: "MMMMM d"
     start: "h:mm am"
     end: "h:mm pm"
     title: "M/d/yy - TITLE"
     img: /assets/images/events/M-d.png
     location: "" # OPTIONAL
     zoom: "" # OPTIONAL
     description: |
       Description paragraph here. Place <br /><br /> in between paragraphs for separation.
     speakers:
       - name: ""
         description: |
           Description of the speaker here. Place <br /><br /> in between paragraphs for separation.
   ```

   > Example (Some text truncated for clarity)
      
   ```
   - link: /events/3-31
     row-title: "A conversation on Central Bank Digital Currency: Why, Why not, Alternatives"
     date: "2022-03-31"
     formatted-date: "March 31"
     start: "10:00 am"
     end: "12:00 pm"
     title: "3/31/22 - A conversation on Central Bank Digital Currency: Why, Why not, Alternatives"
     img: /assets/images/events/3-31.png
     location: Webinar
     zoom: https://berkeley.zoom.us/webinar/register/WN_ZXBLPe7mTEOKWWA4dDTrlw
     description: |
       You're invited! UC Berkeley's new Center for Responsible, Decentralized Intelligence (RDI) is 
       excited to announce the first panel of its Frontier Forum speaker series... 
       <br /><br />
       Featuring a panel of thought leaders from the Federal Reserve and academia, this event will 
       provide insights into the implications of a centralized digital currency.
     speakers:
       - name: Robert C. Hockett
         description: |
           Robert Hockett joined the Cornell Law Faculty in 2004. His ...
       - name: Neha Narula
         description: |
           Neha Narula is the Director of the Digital Currency Initiative at the MIT Media Lab ...
       - name: Ehud Shapiro
         description: |
           Ehud Shapiro is an interdisciplinary scientist, entrepreneur, artist, and political activist ...
       - name: Michael Warner
         description: |
           Mike Warner is a technology strategist who works in the Federal Reserve (FRS) of San Francisco ...
   ```

3. **Add the page**: Go to the `/events` folder, and create a new file with the format `M-d.markdown` (ex. 4-7.markdown). Paste the following code into the file. 
   
   The line marked `<!-- EDIT THIS LINE -->` must be changed within the file. Edit the date in the format of `yyyy-MM-dd` to the correct date of the event.

   ```
   ---
   layout: default
   ---

   ## Events

   <!-- EDIT THIS LINE -->
   <!-- Change the "yyyy-MM-dd" to the appropriate date -->
   {% assign events = site.data.events | where:'date', "yyyy-MM-dd" %}

   <div>
       {% for row in events %}
           <h2 style="font-weight: 700;">Berkeley RDI Frontier Forum</h2>
           <h2 style="font-weight: 700;">{{ row.title }}</h2>
           <h3 style="font-weight: 700;">{{ row.formatted-date }} {{ row.start }} - {{ row.end }} PST</h3>
           {% if row.location %}
               <h3 style="font-weight: 700;">{{ row.location }}</h3>
           {% endif %}
           {% if row.zoom %}
               <h3 class="event-tag">All are welcome to join via the webinar - Register Here:</h3>
               <div class="event-button-wrapper"><button class="event-button"><a class="event-link" href="{{ row.zoom }}" target="_blank">Webinar Registration</a></button></div>
           {% endif %}
           <img src="{{ row.img }}" style="width: 100%; margin-top: 0.5rem; margin-bottom: 0.5rem;">
           <h2>The Event</h2>
           {{ row.description }}
           <h2>Speakers</h2>
           {% for speaker in row.speakers %}
               <h3 style="">{{ speaker.name }}</h3>
               <p style="">{{ speaker.description }}</p>
           {% endfor %}
       {% endfor %}
   </div>
   ```
### How to Add/Update Publications

1. **Update the YAML data file**:
Go to `/_data/publication.yml` and add a new entry at the **top** of the file (most recent first).

2. **Entry Format**
```
- title: "Full Title of the Paper"
  url: "https://arxiv.org/abs/XXXX.XXXXX"
  authors: "Author1*, Author2*, Author3, Author4"
  venue: "Conference/Journal Name"
  year: YYYY
  tags:
    - "Category 1"
    - "Category 2"
```
   > Example
```
- title: "CyberGym: Evaluating AI Agents' Cybersecurity Capabilities"
  url: "https://arxiv.org/abs/2506.02548"
  authors: "Zhun Wang*, Tianneng Shi*, Jingxuan He, Dawn Song"
  venue: "Neural Information Processing Systems (NeurIPS)"
  year: 2025
  tags:
    - "AI for Cybersecurity"
    - "Agentic AI Applications"
```

### How to Add/Update Blog Posts

There are two ways to add blog posts depending on the format:

#### Option 1: Markdown Blog Post (Recommended)

1. **Create the blog post file**: Go to the `/blog` folder and create a new file with the format `blog-title.md` (ex. `rl-grokking-recipe.md`).

2. **Add front matter and content**: At the top of the file, add the Jekyll front matter, then write your blog content in Markdown:

   ```markdown
   ---
   layout: blog
   title: "Your Blog Post Title"
   ---

   <img src="/assets/images/blog/your-cover-image.png" alt="Cover Image" class="cover-image" style="height: 300px">

   # Your Blog Post Title

   <div class="author-info">
   <strong>Author Name¹, Co-Author²</strong><br>
   ¹ University · ² Institution
   </div>

   <div class="metadata">
   <strong>💡 Summary:</strong> Brief description of the blog post.
   <br><br>
   <strong>Link:</strong> <a href="https://example.com" target="_blank">https://example.com</a>
   <br><br>
   <em>(Est. reading time)</em>
   </div>

   ## Your Content Here

   Write your blog post content using Markdown...
   ```

3. **Upload images**: If your blog includes images, upload them to `/assets/images/blog/` folder. Reference them in your markdown as `/assets/images/blog/image-name.png`.

4. **Add to the blogs listing**: Go to `/_data/blogs.yml` and add a new entry at the **top** of the file (most recent first):

   ```yaml
   - link: /blog/your-blog-title
     img: /assets/images/blog/your-cover-image.png
     title: "Your Blog Post Title"
     date: "2025-MM-DD"
     description: "A brief description of your blog post that appears on the blogs page."
     category: "main"
   ```

#### Option 2: HTML Blog Post (For Newsletter/Email Templates)

1. **Create the blog post file**: Go to the `/blog` folder and create a new file with the format `blog-title.html` (ex. `agentic-ai-summit-2025.html`).

2. **Add your HTML content**: Paste your complete HTML content (this works well for converted email newsletters or richly formatted content).

3. **Add to the blogs listing**: Same as Option 1 - go to `/_data/blogs.yml` and add the entry:

   ```yaml
   - link: /blog/your-blog-title
     img: /assets/images/blog/your-cover-image.png
     title: "Your Blog Post Title"
     date: "2025-MM-DD"
     description: "A brief description of your blog post."
     category: "main"
   ```

#### Notes:
- Blog posts appear on the `/blog` page automatically when added to `blogs.yml` with `category: "main"`
- Images on the blog listing page are displayed at 60% width with rounded corners and hover effects
- The blog post itself (when opened) uses the full content width with proper styling
- More recent blog posts (by date) should be added at the top of `blogs.yml`

### Other changes

Please contact xiaoyuanliu \<AT\> berkeley \<DOT\> edu for further support.
