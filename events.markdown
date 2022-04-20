---
layout: default
---

## Events

{% assign events = site.data.events | sort: 'date' %}

<div>
    {% for row in site.data.events %}
        <a class="event-a" href="{{ row.link }}"><h2  style="font-weight: 700;">{{ row.row-title }}</h2></a>
        <h3  style="font-weight: 700;">{{ row.formatted-date }} {{ row.start }} - {{ row.end }} PST</h3>
        <p style="margin-bottom: 2em;">{{ row.description }}</p>
    {% endfor %}
</div>