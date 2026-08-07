import { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';

function ImageDropzone({ onFileAccepted }) {
    const [preview, setPreview] = useState(null);

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            onFileAccepted(file);
        }
    }, [onFileAccepted]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
        multiple: false,
    });

    return (
        <Box
            {...getRootProps()}
            sx={{
                border: `2px dashed ${isDragActive ? 'primary.main' : 'grey.500'}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'transparent',
                transition: 'background-color 0.2s ease-in-out',
                mt: 2,
                mb: 1,
                backgroundImage: `url(${preview})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <input {...getInputProps()} />
            {!preview && (
                <Typography color="textSecondary">
                    {isDragActive ? "Drop the image here..." : "Drag 'n' drop an image here, or click to select"}
                </Typography>
            )}
        </Box>
    );
}

export default ImageDropzone;