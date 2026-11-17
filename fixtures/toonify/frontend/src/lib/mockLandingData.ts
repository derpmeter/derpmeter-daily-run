export type Webtoon = {
    id: string;
    title: string;
    author: string;
    genre: string;
    image: string;
    rating: number;
    views: string;
};

export const MOCK_WEEKLY_WEBTOONS: Webtoon[] = [
    {
        id: '1',
        title: 'Soulfire Rebellion',
        author: 'Park Ji-hoon',
        genre: 'Action',
        image: '/images/mock/cover_action.png',
        rating: 9.8,
        views: '1.2M',
    },
    {
        id: '2',
        title: 'Love Algebra',
        author: 'Yuna Kim',
        genre: 'Romance',
        image: '/images/mock/cover_romance.png',
        rating: 9.9,
        views: '3.5M',
    },
    {
        id: '3',
        title: 'Echoes of the Abyss',
        author: 'DarkMatter',
        genre: 'Thriller',
        image: '/images/mock/cover_thriller.png',
        rating: 9.7,
        views: '800K',
    },
    {
        id: '4',
        title: 'Cyber Drift',
        author: 'NeoSeoul',
        genre: 'Sci-Fi',
        image: '/images/mock/hero_bg.png', // Fallback for now as one generation failed
        rating: 9.5,
        views: '500K',
    },
    {
        id: '5',
        title: 'The Director',
        author: 'Workromancer',
        genre: 'Drama',
        image: '/images/mock/cover_thriller.png',
        rating: 9.6,
        views: '950K',
    },
    {
        id: '6',
        title: 'Campus Life',
        author: 'Studio A',
        genre: 'Slice of Life',
        image: '/images/mock/cover_romance.png',
        rating: 9.4,
        views: '2.1M',
    },
];

export const MOCK_NEW_ARRIVALS: Webtoon[] = [
    {
        id: '7',
        title: 'Level Up Alone',
        author: 'Hunter X',
        genre: 'Fantasy',
        image: '/images/mock/cover_action.png',
        rating: 9.9,
        views: '150K',
    },
    {
        id: '8',
        title: 'Midnight Cafe',
        author: 'Barista',
        genre: 'Drama',
        image: '/images/mock/cover_romance.png',
        rating: 9.8,
        views: '200K',
    },
    {
        id: '9',
        title: 'Ghost Signal',
        author: 'Specter',
        genre: 'Horror',
        image: '/images/mock/cover_thriller.png',
        rating: 9.5,
        views: '90K',
    },
    {
        id: '10',
        title: 'Space Frontier',
        author: 'Pilot',
        genre: 'Sci-Fi',
        image: '/images/mock/hero_bg.png',
        rating: 9.3,
        views: '50K',
    },
];

export const MOCK_RANKING_DATA: Webtoon[] = [
    { ...MOCK_WEEKLY_WEBTOONS[0], views: '5.2M' },
    { ...MOCK_WEEKLY_WEBTOONS[1], views: '4.8M' },
    { ...MOCK_WEEKLY_WEBTOONS[2], views: '4.1M' },
    { ...MOCK_WEEKLY_WEBTOONS[3], views: '3.9M' },
    { ...MOCK_WEEKLY_WEBTOONS[4], views: '3.5M' },
];
