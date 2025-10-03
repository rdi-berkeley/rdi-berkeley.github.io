---
layout: blogs
---

{% assign blogs = site.data.blogs | where: "category", "main" %}

<div>
    {% for row in blogs %}
    <a href="{{ row.link }}" aria-label="Blog"><img alt="Blog Banner" src="{{ row.img }}" style="width: 100%; margin-top: 0.5rem; margin-bottom: 0.5rem;"></a>
    {% endfor %}
</div>
