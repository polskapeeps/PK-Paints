export const SERVICE_GALLERY_CATEGORIES = [
  {
    slug: 'interior-painting',
    name: 'Interior Painting',
    sourceCategory: 'Interior Painting',
    cover: '[59]interior_04-2023.jpeg',
    images: [
      '[16]interior_04-2021.jpeg',
      '[20]interior_04-2021.jpeg',
      '[30]interior_03-2022.jpeg',
      '[33]interior_04-2022.jpeg',
      '[37]interior_11-2022.jpeg',
      '[49]interior_03-2023.jpeg',
      '[52]interior_03-2023.jpeg',
      '[59]interior_04-2023.jpeg',
      '[61]interior_06-2023.jpeg'
    ]
  },
  {
    slug: 'exterior-painting',
    name: 'Exterior Painting',
    sourceCategory: 'Exterior Painting',
    cover: '[11]exterior_05-2023.jpeg',
    images: [
      '[1]exterior_06-2021.jpeg',
      '[3]exterior_06-2021.jpeg',
      '[4]exterior_06-2021.jpeg',
      '[5]exterior_06-2021.jpeg',
      '[8]exterior_01-2023.jpeg',
      '[9]exterior_01-2023.jpeg',
      '[11]exterior_05-2023.jpeg',
      '[13]exterior_05-2023.jpeg'
    ]
  },
  {
    slug: 'custom-trim',
    name: 'Custom Trim & Millwork',
    sourceCategory: 'Carpentry',
    cover: 'cover.jpeg',
    images: [
      'capentry_0002.jpeg',
      'capentry_0003.jpeg',
      'capentry_0004.jpeg',
      'capentry_0012.jpeg',
      'capentry_0024.jpeg',
      'capentry_0030.jpeg',
      'capentry_0041.jpeg',
      'capentry_0053.jpeg',
      'capentry_0064.jpeg',
      'capentry_0075.jpeg',
      'capentry_0086.jpeg',
      'capentry_0098.jpeg'
    ]
  }
];

export const SERVICE_GALLERY_PAGE_SECTIONS = {
  'interior-painting': [
    {
      slug: 'painting-trim',
      anchor: 'gallery-painting-trim',
      heading: 'Paint & trim highlights',
      altPrefix: 'Project finish',
      copy:
        'Walls, exteriors, and custom millwork finished with consistent prep, coatings, and detailing.',
      sources: ['interior-painting', 'exterior-painting', 'custom-trim']
    }
  ],
  carpentry: [
    {
      slug: 'custom-trim',
      anchor: 'gallery-custom-trim',
      heading: 'Custom trim highlights',
      altPrefix: 'Custom trim installation',
      copy:
        'Feature walls, built-ins, wainscoting, and bespoke details that showcase our millwork capabilities.'
    }
  ]
};

export const SERVICE_GALLERY_NAV_LINKS = [
  {
    slug: 'interior-painting',
    label: 'Interior Painting',
    href: 'gallery.html?category=interior-painting'
  },
  {
    slug: 'exterior-painting',
    label: 'Exterior Painting',
    href: 'gallery.html?category=exterior-painting'
  },
  {
    slug: 'custom-trim',
    label: 'Custom Trim & Millwork',
    href: 'gallery.html?category=custom-trim'
  }
];
