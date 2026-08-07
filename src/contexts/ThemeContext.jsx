import { createContext, useState, useMemo, useContext } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export function CustomThemeProvider({ children }) {
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('themeMode') || 'light';
    });

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const newMode = prevMode === 'light' ? 'dark' : 'light';
                    localStorage.setItem('themeMode', newMode);
                    return newMode;
                });
            },
            mode
        }),
        [mode]
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: mode === 'light' ? '#0d47a1' : '#42a5f5',
                    },
                    secondary: {
                        main: mode === 'light' ? '#2e7d32' : '#66bb6a',
                    },
                    background: {
                        default: mode === 'light' ? '#f4f6f9' : '#0b132b',
                        paper: mode === 'light' ? '#ffffff' : '#1c2541',
                    },
                },
                shape: {
                    borderRadius: 12,
                },
                components: {
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: mode === 'light'
                                        ? '0 12px 24px rgba(0, 0, 0, 0.12)'
                                        : '0 12px 24px rgba(0, 0, 0, 0.5)',
                                },
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                            },
                        },
                    },
                },
            }),
        [mode]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export const useColorMode = () => useContext(ColorModeContext);
