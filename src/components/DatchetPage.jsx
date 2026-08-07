import { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Card, CardContent, Divider, Chip } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import AirIcon from '@mui/icons-material/Air';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import HeaderBanner from './HeaderBanner.jsx';

function DatchetPage() {
    const [iframeKey, setIframeKey] = useState(Date.now());

    const handleRefresh = () => {
        setIframeKey(Date.now());
    };

    return (
        <Box sx={{ pb: 4 }}>
            <HeaderBanner
                title="Datchet Water Live & Forecast"
                subtitle="Live webcam feed, real-time wind station, and forecast for Queen Mother Reservoir."
                bgGradient="linear-gradient(135deg, #0288d1 0%, #26c6da 100%)"
                actionButton={
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                    >
                        Refresh Feeds
                    </Button>
                }
            />

            <Grid container spacing={3}>
                {/* Datchet Live Webcam Feed */}
                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <VideocamIcon color="primary" />
                                <Typography variant="h6" fontWeight="bold">
                                    DatchetCam Live Video
                                </Typography>
                            </Box>
                            <Chip label="Live Stream" color="error" size="small" />
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Updates automatically with a 10-second clip every few minutes from the club house.
                        </Typography>

                        <Box sx={{
                            width: '100%',
                            minHeight: 380,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.08)'
                        }}>
                            <iframe
                                key={`video-${iframeKey}`}
                                src="https://live.dwsc.co.uk/video"
                                title="Datchet Live Webcam Feed"
                                scrolling="no"
                                style={{
                                    width: '100%',
                                    height: '380px',
                                    border: 0,
                                    overflow: 'hidden'
                                }}
                                allowFullScreen
                            />
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                size="small"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://live.dwsc.co.uk/video"
                                endIcon={<OpenInNewIcon />}
                            >
                                Open Full Screen Stream
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Real-time Wind Station Gauge */}
                <Grid item xs={12} md={5}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <AirIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                                Real-Time Wind Gauge
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Direct wind telemetry readings from Datchet Water Sailing Club.
                        </Typography>

                        <Box sx={{
                            width: '100%',
                            minHeight: 380,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.08)',
                            backgroundColor: '#fafafa'
                        }}>
                            <iframe
                                key={`gauge-${iframeKey}`}
                                src="https://live.dwsc.co.uk/"
                                title="Datchet Live Wind Station"
                                scrolling="no"
                                style={{
                                    width: '100%',
                                    height: '380px',
                                    border: 0,
                                    overflow: 'hidden'
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Wind Forecast Section */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Typography variant="h5" fontWeight="bold">
                                Wind & Weather Forecast (Queen Mother Reservoir)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.windguru.cz/149680"
                                    endIcon={<OpenInNewIcon />}
                                >
                                    Windguru Direct
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.dwsc.co.uk"
                                    endIcon={<OpenInNewIcon />}
                                >
                                    Official DWSC Website
                                </Button>
                            </Box>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                                    Windy Live Map
                                </Typography>
                                <Box sx={{ minHeight: 450, borderRadius: 2, overflow: 'hidden' }}>
                                    <iframe
                                        src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=kts&zoom=11&overlay=wind&product=ecmwf&level=surface&lat=51.482&lon=-0.542"
                                        title="Windy Live Map"
                                        style={{ width: '100%', height: '450px', border: 0 }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DatchetPage;
