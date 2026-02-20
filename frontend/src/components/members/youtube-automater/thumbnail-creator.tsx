import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, Skeleton, Avatar } from '@mui/material';
import { Image, ArrowUpward, ArrowDownward, Add, Search, CloudUpload } from '@mui/icons-material';

interface ThumbnailTemplate {
    id: string;
    name: string;
    previewUrl: string;
}

interface ThumbnailCreationRequest {
    templateId: string;
    videoTitle: string;
}

export function MembersThumbnailCreatorPage() {
    const [thumbnailTemplates, setThumbnailTemplates] = useState<ThumbnailTemplate[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    useEffect(() => {
        // Simulate fetch call with timeout for loading state
        setTimeout(() => {
            const data: ThumbnailTemplate[] = [
                { id: '1', name: 'Bold & Bright', previewUrl: '/images/thumbnail1.png' },
                { id: '2', name: 'Minimal & Clean', previewUrl: '/images/thumbnail2.png' },
                { id: '3', name: 'Retro Vibes', previewUrl: '/images/thumbnail3.png' },
            ];
            setThumbnailTemplates(data);
            setLoading(false);
        }, 1200);
    }, []);

    const handleCreateThumbnail = (request: ThumbnailCreationRequest) => {
        console.log("Creating thumbnail:", request);
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#fafbfc' }}>
            <Box sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: 16, color: '#fff', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 2 }}><Image sx={{ mr: 1 }} /> Thumbnail Creator</Typography>
                <Typography variant="body1">Enhance your YouTube channel's visual appeal with custom thumbnails!</Typography>
            </Box>

            <Grid container spacing={4}>
                {loading ? (
                    [0, 1, 2].map(index => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Skeleton variant="rectangular" sx={{ height: 200, borderRadius: 3 }} />
                            <Box sx={{ mt: 2 }}>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="text" width="40%" />
                            </Box>
                        </Grid>
                    ))
                ) : (
                    thumbnailTemplates.map(template => (
                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                            <Card
                                sx={{
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                    borderRadius: 3,
                                    transition: '0.2s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar src={template.previewUrl} sx={{ width: 64, height: 64, mr: 2 }} />
                                        <Box>
                                            <Typography variant="h6">{template.name}</Typography>
                                            <Chip icon={<ArrowUpward />} label="Popular" color="primary" size="small" />
                                        </Box>
                                    </Box>
                                    <Button variant="contained" color="primary" sx={{ borderRadius: 10 }} onClick={() => setSelectedTemplate(template.id)}>
                                        <Add sx={{ mr: 1 }} /> Select Template
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {selectedTemplate && (
                <Box sx={{ mt: 4, p: 2, backgroundColor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 16 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}><CloudUpload sx={{ mr: 1 }} /> Prepare Your Thumbnail</Typography>
                    <Button variant="contained" color="primary" sx={{ borderRadius: 10 }} onClick={() => handleCreateThumbnail({ templateId: selectedTemplate, videoTitle: 'Your Video Title' })}>
                        <Search sx={{ mr: 1 }} /> Generate Thumbnail
                    </Button>
                </Box>
            )}
        </Box>
    );
}