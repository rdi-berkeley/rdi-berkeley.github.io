---
layout: blog-listing
---

{% assign blogs = site.data.blogs | where: "category", "main" %}

<div style="max-width: 60%; margin: 0 auto;">
    {% for row in blogs %}
    <a href="{{ row.link }}" aria-label="Blog">
        <img alt="Blog Banner" src="{{ row.img }}" style="width: 100%; margin-top: 0.5rem; margin-bottom: 0.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.3s ease, box-shadow 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 12px rgba(0, 0, 0, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';">
    </a>
    {% endfor %}
</div>
