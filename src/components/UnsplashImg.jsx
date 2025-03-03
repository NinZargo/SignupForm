import axios from "axios";

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const fetchUnsplashImage = async (query) => {
    try {
        const response = await axios.get(`https://api.unsplash.com/search/photos`, {
            params: { query, per_page: 1 },
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        });

        if (response.data.results.length > 0) {
            return response.data.results[0].urls.regular;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching image from Unsplash:", error);
        return null;
    }
};

export default fetchUnsplashImage;