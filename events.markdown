---
layout: default
---

## Events

<!-- <div style='font-family: "Open Sans", sans-serif;'> -->
<div>
    {% for row in site.data.events %}
        <h2 style="font-weight: 700;">{{ row.title }}</h2>
        <h2 style="font-weight: 700;">{{ row.subtitle }}</h2>
        <h3 style="font-weight: 700;">{{ row.date }} {{ row.start }} - {{ row.end }} PST</h3>
        <img src="{{ row.img }}" style="width: 100%; margin-top: 0.5rem; margin-bottom: 0.5rem;">
        <h2>The Event</h2>
        {{ row.description }}
        <button class="event-button"><a class="event-link" href="{{ row.link }}" target="_blank">Register Here</a></button>
        <h2>Speakers</h2>
        {% for speaker in row.speakers %}
            <h3 style="">{{ speaker.name }}</h3>
            <p style="">{{ speaker.description }}</p>
        {% endfor %}
    {% endfor %}
</div>