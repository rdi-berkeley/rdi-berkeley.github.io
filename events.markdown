---
layout: default
---

## Events

{% assign events = site.data.events | sort: 'date' %}

<div>
    {% for row in site.data.events %}
    <a href="{{ row.link }}"><img src="{{ row.img }}" style="width: 100%; margin-top: 0.5rem; margin-bottom: 0.5rem;"></a>
        <!-- <a class="event-a" href="{{ row.link }}"><h2  style="font-weight: 700;">{{ row.row-title }}</h2></a>
        <h3  style="font-weight: 700;">{{ row.formatted-date }} {{ row.start }} - {{ row.end }} PT</h3>
        <p style="margin-bottom: 2em;">{{ row.description }}</p> -->
    {% endfor %}
</div>