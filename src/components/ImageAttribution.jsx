import { Box, Link, Typography } from '@mui/material';

function ImageAttribution({ photographerName, photographerUrl }) {
    const appName = "Brunel_Sailing_Signups"; // Use your app's name for the UTM source

    if (!photographerName || !photographerUrl) {
        return null;
    }

    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 1,
                fontSize: '0.75rem',
            }}
        >
            <Typography variant="caption">
                Photo by{' '}
                <Link
                    href={`${photographerUrl}?utm_source=${appName}&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                >
                    {photographerName}
                </Link>
                {' '}on{' '}
                <Link
                    href={`https://unsplash.com/?utm_source=${appName}&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                >
                    Unsplash
                </Link>
            </Typography>
        </Box>
    );
}

export default ImageAttribution;