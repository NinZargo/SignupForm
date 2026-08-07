import axios from "axios";

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const fetchUnsplashImage = async (query) => {
    try {
        // 1. Fetch a list of 10 related photos instead of just one
        const response = await axios.get(`https://api.unsplash.com/search/photos`, {
            params: {
                query: query,
                per_page: 10,
                orientation: 'landscape'
            },
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        });

        if (response.data.results && response.data.results.length > 0) {
            // 2. Pick a random photo from the list of results
            const randomIndex = Math.floor(Math.random() * response.data.results.length);
            const randomPhoto = response.data.results[randomIndex];

            // 3. Return the full data object for attribution
            return {
                imageUrl: randomPhoto.urls.regular,
                photographerName: randomPhoto.user.name,
                photographerUrl: randomPhoto.user.links.html,
            };
        } else {
            // Fallback if no images are found for the specific query
            return await fetchUnsplashImage('sailing event');
        }
    } catch (error) {
        console.error("Error fetching image from Unsplash:", error);
        return null;
    }
};

export default fetchUnsplashImage;