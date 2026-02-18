import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Button, 
    IconButton, 
    Chip, 
    Divider, 
    Skeleton, 
    Tooltip 
} from '@mui/material';
import { 
    Message, 
    TrendingUp, 
    Campaign, 
    AutoAwesome, 
    ArrowUpward, 
    ArrowDownward, 
    Edit, 
    Delete, 
    AddCircle 
} from '@mui/icons-material';

interface AutomatedMessage {
    id: string;
    content: string;
    successRate: number;
}

export function MembersAutomatedMessagesPage() {
    const [messages, setMessages] = useState<AutomatedMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);

    const fetchMessages = useCallback(async () => {
        const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3000' : '';
        try {
            const response = await fetch(`${API_BASE}/api/automated-messages`);
            if (!response.ok) {
                throw new Error("Failed to fetch messages");
            }
            const data: AutomatedMessage[] = await response.json();
            setMessages(data);
        } catch (err) {
            console.error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const renderLoadingState = () => (
        <Grid container spacing={3} sx={{ mt: 3 }}>
            {[1, 2, 3].map(index => (
                <Grid item xs={12} md={4} key={index}>
                    <Skeleton variant="rectangular" height={140} />
                </Grid>
            ))}
        </Grid>
    );

    const renderEmptyState = () => (
        <Box sx={{ textAlign: 'center', mt: 5 }}>
            <AutoAwesome sx={{ fontSize: '64px', color: 'rgba(0,0,0,0.2)' }} />
            <Typography variant="h6" sx={{ mt: 2, color: 'rgba(0,0,0,0.4)' }}>
                You haven't set up any automated messages yet.
            </Typography>
            <Button
                variant="contained"
                startIcon={<AddCircle />}
                onClick={handleOpenModal}
                sx={{ mt: 3 }}
            >
                Create Automated Message
            </Button>
        </Box>
    );

    const renderMessages = () => (
        <Grid container spacing={3} sx={{ mt: 3 }}>
            {messages.map(message => (
                <Grid item xs={12} sm={6} md={4} key={message.id}>
                    <Card
                        sx={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)', '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Message sx={{ color: '#1976d2', mr: 1 }} />
                                <Typography variant="h6" noWrap sx={{ fontSize: '1.1rem' }}>
                                    Automated Message
                                </Typography>
                            </Box>
                            <Typography sx={{ mb: 1.5 }}>{message.content}</Typography>
                            <Divider sx={{ mb: 1.5 }}/>
                            <Chip
                                label={`Success Rate: ${message.successRate}%`}
                                color={message.successRate > 70 ? 'success' : 'warning'}
                                icon={message.successRate > 70 ? <ArrowUpward /> : <ArrowDownward />}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Tooltip title="Edit Message">
                                    <IconButton size="small" onClick={handleOpenModal}>
                                        <Edit />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Message">
                                    <IconButton size="small">
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    return (
        <Box>
            <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #5147ad 100%)', borderRadius: '16px', p: 3, mb: 4 }}>
                <Typography variant="h4" sx={{ color: 'white', display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Campaign sx={{ mr: 1 }}/> Automated Message Campaigns
                </Typography>
                <Typography sx={{ color: 'white' }}>Manage and review your LinkedIn automated message campaigns.</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 5 }}>
                <TrendingUp sx={{ fontSize: '64px', color: 'rgba(0,0,0,0.6)' }} />
                <Typography variant="h6" sx={{ mt: 2, color: '#1a1a2e' }}>
                    Integrate LinkedIn Profile Scraper with Apify to gather detailed member insights.
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddCircle />}
                    sx={{ mt: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                    Start Scraping
                </Button>
            </Box>
            {isLoading ? renderLoadingState() : (messages.length === 0 ? renderEmptyState() : renderMessages())}
        </Box>
    );
}