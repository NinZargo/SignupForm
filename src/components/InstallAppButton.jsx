import { useState, useEffect } from 'react';
import { Button, Tooltip } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

export default function InstallAppButton() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
        } else {
            console.log('User dismissed the PWA install prompt');
        }

        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    if (!isInstallable) return null;

    return (
        <Tooltip title="Install Brunel Sailing App to your desktop or phone">
            <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<GetAppIcon />}
                onClick={handleInstallClick}
                sx={{ textTransform: 'none', borderRadius: 2, px: 1.5 }}
            >
                Install App
            </Button>
        </Tooltip>
    );
}
