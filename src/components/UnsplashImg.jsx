import axios from "axios";

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const fetchUnsplashImage = async (query) => {
    try {
        // Use the /photos/random endpoint which is designed for this purpose
        const response = await axios.get(`https://api.unsplash.com/photos/random`, {
            params: {
                query: query, // The search term
                orientation: 'landscape' // Ensures the image fits a desktop screen well
            },
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        });

        // The random endpoint returns a single image object directly
        if (response.data && response.data.urls) {
            return response.data.urls.regular; // Use the 'regular' size for good quality
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching image from Unsplash:", error);
        return null; // Return null if there's an error
    }
};

export default fetchUnsplashImage;