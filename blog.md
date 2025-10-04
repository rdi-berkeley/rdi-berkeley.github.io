---
layout: blog-listing
---

{% assign blogs = site.data.blogs | where: "category", "main" %}

<div class="max-w-6xl mx-auto px-6 py-12">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {% for row in blogs %}
        <a href="{{ row.link }}" class="group block">
            <div class="relative w-full" style="padding-bottom: 100%;">
                <div class="absolute inset-0 bg-white rounded-lg shadow hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
                    <div class="relative overflow-hidden bg-gray-100" style="height: 70%;">
                        <img alt="{{ row.title }}" src="{{ row.img }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    </div>
                    <div class="p-4 flex flex-col justify-center" style="height: 30%;">
                        <h3 class="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{{ row.title }}</h3>
                        <p class="text-xs text-gray-500">{{ row.date | date: "%B %d, %Y" }}</p>
                    </div>
                </div>
            </div>
        </a>
        {% endfor %}
    </div>
</div>
